import importlib.util
import os
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('worker', Path(__file__).with_name('worker.py'))
worker = importlib.util.module_from_spec(spec)
spec.loader.exec_module(worker)


class WorkerTests(unittest.TestCase):
    def test_remote_requires_tls_even_outside_production(self):
        with patch.dict(os.environ, {'FALKORDB_URL': 'redis://example.test:6379'}):
            with self.assertRaisesRegex(ValueError, 'verified TLS'):
                worker.connection_config('test')

    def test_tls_always_checks_certificate_and_hostname(self):
        with patch.dict(os.environ, {'FALKORDB_URL': 'rediss://user:p%40ss@example.test:6380'}):
            config = worker.connection_config('test')
            self.assertTrue(config.ssl)
            self.assertTrue(config.ssl_check_hostname)
            self.assertEqual(config.ssl_cert_reqs, 'required')
            self.assertEqual(config.password, 'p@ss')

    def test_local_connection_is_allowed(self):
        with patch.dict(os.environ, {'FALKORDB_URL': 'falkor://127.0.0.1:6380'}):
            self.assertFalse(worker.connection_config('test').ssl)

    def test_cloud_only_imports(self):
        self.assertNotIn('torch', sys.modules)
        self.assertNotIn('gliner', sys.modules)

    def test_provider_budget_prevents_http_call(self):
        provider = worker.Gemini()
        provider.calls = 40
        with patch.object(worker.requests, 'post') as post:
            with self.assertRaises(worker.ProviderError):
                provider.request('gemini-3.5-flash-lite', 'generateContent', {})
            post.assert_not_called()
            self.assertEqual(provider.failure, 429)

    def test_invalid_scope_rejected_before_connections(self):
        import asyncio
        with self.assertRaisesRegex(ValueError, 'graph scope'):
            asyncio.run(worker.run({'graphName': '../../other-workspace'}))

    def test_failure_diagnostics_exclude_exception_messages(self):
        import json
        import subprocess
        result = subprocess.run([sys.executable, str(Path(__file__).with_name('worker.py'))],
                                input='{"graphName":"private-invalid-value"}', text=True, capture_output=True)
        self.assertEqual(result.returncode, 1)
        self.assertEqual(json.loads(result.stdout), {'error': 'SDK_UNAVAILABLE', 'errorType': 'ValueError', 'status': 503})
        self.assertNotIn('private-invalid-value', result.stdout + result.stderr)


if __name__ == '__main__':
    unittest.main()

FROM node:22-bookworm-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build && npm prune --omit=dev

FROM python:3.13-slim-trixie AS sdk
ENV HNSWLIB_NO_NATIVE=1
RUN apt-get update && apt-get install -y --no-install-recommends g++ && rm -rf /var/lib/apt/lists/*
RUN python -m venv /opt/graphrag
COPY graphrag/requirements-cloud.lock /tmp/requirements-cloud.lock
RUN /opt/graphrag/bin/pip install --no-cache-dir -r /tmp/requirements-cloud.lock && /opt/graphrag/bin/pip install --no-cache-dir --no-deps graphrag-sdk==1.4.0

FROM falkordb/falkordb@sha256:b0bdcac2cbaff989e77cb0610439b7a9289e86de033ccbbd4368b66fb680ae7a
RUN apt-get update && apt-get install -y --no-install-recommends libffi8 libgomp1 && rm -rf /var/lib/apt/lists/*
COPY --from=sdk /usr/local /usr/local
COPY --from=sdk /opt/graphrag /opt/graphrag
COPY --from=node:22-bookworm-slim /usr/local/bin/node /usr/local/bin/node
WORKDIR /app
COPY --from=build /app /app
COPY scripts/start-container.sh /usr/local/bin/start-opsrelay
RUN chmod +x /usr/local/bin/start-opsrelay
ENV FALKORDB_URL=redis://127.0.0.1:6379 FALKORDB_GRAPH=opsrelay PORT=10000
ENV GRAPHRAG_PYTHON=/opt/graphrag/bin/python
EXPOSE 10000
ENTRYPOINT ["/usr/local/bin/start-opsrelay"]

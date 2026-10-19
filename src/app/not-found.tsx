import Link from "next/link";
import { SiteHeader, SiteFooter } from "./landing/Landing";
import s from "./landing/landing.module.css";

export default function NotFound() {
  return <div className={s.site}><SiteHeader/><main className={s.trust}><h1>Page not found.</h1><p>This address doesn’t lead to an OpsRelay page. Return to the product overview or open your workspace.</p><Link className={s.button} href="/">Back to OpsRelay</Link><p style={{ marginTop: 24 }}><Link href="/workspace">Open workspace</Link></p></main><SiteFooter/></div>;
}

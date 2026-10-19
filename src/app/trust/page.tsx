import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader, SiteFooter } from "../landing/Landing";
import s from "../landing/landing.module.css";

export const metadata: Metadata = { title: "Trust & boundaries — OpsRelay", description: "Understand demo data, session isolation, human review, cloud AI, and hosting limits in OpsRelay." };

const sections = [
  ["A demonstration you can inspect", "OpsRelay is an open-source supplier disruption demonstration. Northstar Works, its suppliers, customers, team members, and orders are fictional. No customer adoption, security certification, or enterprise readiness is claimed."],
  ["Your demo has its own graph", "Explore live demo creates a separate FalkorDB graph assigned to your browser session. Other demo visitors cannot select it through the app. Sessions expire after one hour, and expired demo graphs are cleaned up when a later demo is created. The free host can reset sessions and graphs earlier."],
  ["The source stays with the decision", "Supply changes retain dated source records, superseded plans, and review history. Text notices enter as pending evidence. A person must review a candidate date before it changes the plan. Stale notices and stale draft approvals are rejected."],
  ["You review the response", "The app calculates coverage using supply and inventory allocated in due-date order. Recommendations and customer responses require human review. Approval records a decision or enables a draft download. OpsRelay does not send emails, change purchase orders, or update an ERP."],
  ["Cloud AI is optional", "When configured, Gemini receives the investigation question and bounded graph tool results. Uploaded notices and human lessons may be included. Only use information you are allowed to share with the configured cloud provider. The model has no supply-write or messaging tool. Citation checks establish source identity, not the accuracy of every sentence."],
  ["Persistence depends on hosting", "The public free Render deployment is ephemeral: restart or redeployment can erase changes. The repository includes a persistent local FalkorDB configuration and tested snapshot restore instructions. A real company deployment needs suitable persistent hosting, backups, access controls, and a data-sharing review."],
];

export default function TrustPage() {
  return <div className={s.site}><a className={s.skip} href="#trust-main">Skip to content</a><SiteHeader/><main className={s.trust} id="trust-main"><h1>Clarity includes<br/>the boundaries.</h1><p>What OpsRelay does, how the demonstration handles information, and where human judgment stays in the loop.</p>{sections.map(([title, body]) => <section key={title}><h2>{title}</h2><p>{body}</p></section>)}<section><h2>Inspect the implementation</h2><p>Read the <a href="https://github.com/Kartik2004sharma/OpsRelay" target="_blank" rel="noreferrer">source code and verification records</a> or return to the <Link href="/">product overview</Link>. Use repository issues for implementation questions. Do not include credentials or private company data in a public issue.</p></section></main><SiteFooter/></div>;
}

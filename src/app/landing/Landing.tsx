"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { allocate } from "@/lib/allocation";
import s from "./landing.module.css";

const repository = "https://github.com/Kartik2004sharma/OpsRelay";
const commitments = [
  { id: "SO-1041", customer: "Hightower Distribution", dueDate: "2026-10-25", required: 4, owner: "Ari Chen", product: "Atlas Conveyor" },
  { id: "SO-1042", customer: "Vale Foods", dueDate: "2026-10-28", required: 3, owner: "Sam Rivera", product: "Boreal Sorter" },
  { id: "SO-1043", customer: "Cedar Logistics", dueDate: "2026-11-15", required: 1, owner: "Not assigned", product: "Boreal Sorter" },
];

export function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={diagonal ? "M6 18L18 6 M6 6h12v12" : "M4 12h15 M13 6l6 6-6 6"}/></svg>;
}

export function Logo() {
  return <Link className={s.logo} href="/" aria-label="OpsRelay home"><svg width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden="true"><rect width="30" height="30" rx="8" fill="currentColor"/><path d="M9 9L21 15 9 21V9Z" stroke="white" strokeWidth="1.3"/><circle cx="9" cy="9" r="2.2" fill="white"/><circle cx="9" cy="21" r="2.2" fill="white"/><circle cx="21" cy="15" r="2.2" fill="white"/></svg><span>opsrelay<span className={s.logoDot}>.</span></span></Link>;
}

export function DemoButton({ label = "Explore live demo", className = "" }: { label?: string; className?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function launch() {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "demo" }), signal: AbortSignal.timeout(45_000) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "The demo could not be opened. Please try again.");
      router.push("/workspace");
    } catch (cause) {
      setError(cause instanceof Error && cause.name !== "TimeoutError" ? cause.message : "The free service is waking up. Wait a moment, then try again.");
      setBusy(false);
    }
  }
  return <div className={`${s.launch} ${className}`}><button className={s.button} type="button" onClick={launch} disabled={busy}>{busy ? "Opening your workspace…" : label}<Arrow/></button>{error && <p role="alert" className={s.launchError}>{error}</p>}</div>;
}

export function SiteHeader() {
  return <header className={s.header}><div className={s.headerInner}><Logo/><nav className={s.desktopNav} aria-label="Main navigation"><Link href="/#product">Product</Link><Link href="/#workflow">How it works</Link><Link href="/#company-brain">Company brain</Link><Link href="/#questions">FAQ</Link></nav><div className={s.headerActions}><Link className={s.workspaceLink} href="/workspace">Open workspace <Arrow diagonal/></Link><details className={s.mobileNav}><summary aria-label="Open navigation"><span/><span/></summary><nav aria-label="Mobile navigation" onClick={(event) => { if (event.target instanceof Element && event.target.closest("a")) event.currentTarget.closest("details")?.removeAttribute("open"); }}><Link href="/#product">Product</Link><Link href="/#workflow">How it works</Link><Link href="/#company-brain">Company brain</Link><Link href="/#questions">FAQ</Link><Link href="/workspace">Open workspace</Link></nav></details></div></div></header>;
}

export function SiteFooter() {
  return <footer className={s.footer}><div className={s.footerTop}><div><Logo/><p>Clarity for the commitments<br/>behind every component.</p></div><div className={s.footerLinks}><Link href="/#product">Product</Link><Link href="/#walkthrough">Walkthrough</Link><Link href="/trust">Trust & boundaries</Link><a href={`${repository}/blob/main/demo/CREDITS.md`} target="_blank" rel="noreferrer">Media credits</a><a href={repository} target="_blank" rel="noreferrer">GitHub <Arrow diagonal/></a></div></div><div className={s.footerBottom}><span>Built with FalkorDB. Made for connected decisions.</span><span>Graph Hacks 2026 · Company Brain</span></div></footer>;
}

function SupplyPreview() {
  const [scenario, setScenario] = useState("delay");
  const currentDate = scenario === "delay" ? "2026-11-05" : "2026-10-20";
  const allocation = allocate(commitments, 2, 6, currentDate);
  const atRisk = allocation.filter((order) => order.shortage > 0).length;
  const shortage = allocation.reduce((sum, order) => sum + order.shortage, 0);
  const [selected, setSelected] = useState("SO-1041");
  const current = commitments.find((order) => order.id === selected)!;
  const currentAllocation = allocation.find((order) => order.id === selected)!;
  return <div className={s.preview} id="product">
    <div className={s.previewHeader}><span><span className={s.liveDot}/> Northstar Works</span><span>Synthetic scenario</span></div>
    <div className={s.scenarioTabs} role="group" aria-label="Supply scenario">{[["plan", "Original plan"], ["delay", "Supplier delay"], ["recovery", "Recovery"]].map(([value, label]) => <button type="button" key={value} aria-pressed={scenario === value} onClick={() => setScenario(value)}>{label}</button>)}</div>
    <div className={s.previewTitle}><strong>{atRisk ? "One delay. Two commitments at risk." : "Supply restored. Commitments covered."}</strong><span>Explore the connections below</span></div>
    <div className={`${s.graph} ${atRisk ? s.disrupted : ""}`}>
      <svg className={s.graphLines} viewBox="0 0 580 226" preserveAspectRatio="none" aria-hidden="true"><path d="M118 113H168 M292 113H334V35H369 M334 113H369 M334 113V191H369"/></svg>
      <div className={s.supplierNode}><span className={s.nodeType}>Supplier</span><strong>Kestrel<br/>Components</strong><span>PO-204 · 6 inbound</span></div>
      <div className={s.componentNode}><span className={s.nodeType}>Shared component</span><strong>M14 motor</strong><span>2 motors on hand</span><small>ETA {atRisk ? "05 Nov" : "20 Oct"}</small></div>
      <div className={s.orderNodes}>{commitments.map((order) => {
        const impact = allocation.find((item) => item.id === order.id)!;
        return <button type="button" key={order.id} className={`${s.orderNode} ${impact.shortage ? s.orderRisk : ""}`} aria-pressed={selected === order.id} aria-label={`Preview ${order.id}, ${impact.shortage ? `${impact.shortage} motors short` : "covered"}`} onClick={() => setSelected(order.id)}><strong>{order.id}<span>{impact.shortage ? `${impact.shortage} short` : "Covered"}</span></strong><span>{order.customer}</span></button>;
      })}</div>
    </div>
    <div className={s.previewImpact} role="status"><span className={atRisk ? s.riskDot : s.liveDot}/><strong>{atRisk ? `${shortage} motors short across ${atRisk} orders` : "All 3 customer commitments covered"}</strong><span>{scenario === "recovery" ? "Recovery confirmed" : "Calculated from supply"}</span></div>
    <div className={s.selectedOrder}><div><small>{current.id} · {current.product}</small><strong>{currentAllocation.covered} of {current.required} motors covered</strong></div><div><small>Response owner</small><strong>{current.owner}</strong></div></div>
    <div className={s.previewFoot}><span>Supplier → component → product → commitment</span><span>FalkorDB</span></div>
  </div>;
}

const brainViews = [
  { key: "evidence", title: "Keep the source with the story.", copy: "Trace an answer to its original record. Current facts, pending notices, and superseded plans keep their own place in the timeline." },
  { key: "memory", title: "Remember what the team learned.", copy: "Keep source-linked lessons and previous investigations in your workspace graph, ready for the next disruption." },
  { key: "review", title: "Turn context into a reviewed response.", copy: "Prepare a customer response from calculated coverage. A person reviews it before it becomes a downloadable draft." },
];

function CompanyBrain() {
  const [active, setActive] = useState("evidence");
  const view = brainViews.find((item) => item.key === active)!;
  return <section className={s.brainSection} id="company-brain"><div className={s.sectionInner}><div className={s.brainIntro}><h2>Your company should<br/>remember <em>why.</em></h2><p>The answer is rarely in one document. Connect the facts, the people, and the decisions that bring your operations into focus.</p></div><div className={s.brainContent}><div className={s.brainChoices} role="group" aria-label="Company brain capabilities">{brainViews.map((item) => <button key={item.key} type="button" aria-pressed={item.key === active} onClick={() => setActive(item.key)}><span>{item.title}</span><Arrow/></button>)}</div><div className={s.brainDisplay} aria-live="polite"><h3>{view.title}</h3><p>{view.copy}</p>{active === "evidence" ? <div className={s.sourceDocument}><div><span>PO-204</span><span className={s.smallStatus}>Superseded plan</span></div><blockquote>“Six M14 motors expected on 20 October 2026.”</blockquote><div className={s.documentUpdate}><span>Supplier delay notice</span><strong>Revised arrival: 5 November</strong><small>Original evidence retained. Current plan updated.</small></div></div> : active === "memory" ? <div className={s.sourceDocument}><div><span>Team lesson</span><span className={s.smallStatus}>Source linked</span></div><blockquote>“Review affected commitments with their recorded owners before promising a recovery date.”</blockquote><div className={s.documentUpdate}><span>Kept in the company graph</span><strong>Available in the next session</strong><small>Operator data persists with durable database hosting.</small></div></div> : <div className={s.sourceDocument}><div><span>SO-1041 response</span><span className={s.smallStatus}>Needs review</span></div><blockquote>“We are assessing recovery options. An alternative delivery promise has not been confirmed.”</blockquote><div className={s.documentUpdate}><span>Next step</span><strong>Review → approve → download</strong><small>No customer message is sent by OpsRelay.</small></div></div>}<p className={s.previewProvenance}>Illustrative product preview · synthetic records</p></div></div></div></section>;
}

const questions = [
  ["Can I try it without creating an account?", "Yes. Explore live demo creates an isolated workspace with fictional company records. No email or password is needed. Demo sessions last up to one hour; free hosting may reset them sooner."],
  ["What happens when I record a supplier delay?", "OpsRelay follows the component’s connections to products, orders, and customers. It recalculates coverage in due-date order and creates response tasks for commitments with shortages. Earlier evidence stays visible."],
  ["Does OpsRelay send messages or change our ERP?", "No. Reviews record a decision within OpsRelay. Customer responses are drafts that you can approve and download. No email, purchase order, or ERP update is sent automatically."],
  ["Where does the AI fit?", "The optional Gemini agent investigates through bounded, read-only graph tools and returns source citations. It needs a server-side API key and available provider quota. The core allocation and quick graph answers remain deterministic."],
  ["Is this ready for private company data?", "The public website is a synthetic-data demonstration. A real deployment needs suitable database persistence, backups, access controls, and a data-sharing review for the cloud model. Read Trust & boundaries before adapting it."],
];

export default function Landing() {
  return <div className={s.site}>
    <a className={s.skip} href="#landing-main">Skip to content</a><SiteHeader/>
    <main id="landing-main">
      <section className={s.hero}><div className={s.heroCopy}><h1>A supplier slips.<br/>Know what <span>moves.</span></h1><p>See which customer commitments are affected, trace the evidence, and give the right people a clear next step.</p><div className={s.heroActions}><DemoButton/><a className={s.textLink} href="#walkthrough">See it in action <Arrow diagonal/></a></div><span className={s.heroNote}>No signup. Synthetic data. Your own workspace.</span></div><SupplyPreview/></section>
      <div className={s.proofStrip}><p>Every commitment<br/>has a connection.</p><span><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><path d="M5 5l14 7-14 7V5Z"/><circle cx="5" cy="5" r="2"/><circle cx="19" cy="12" r="2"/><circle cx="5" cy="19" r="2"/></svg>FalkorDB at the core</span><span><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><path d="M6 3h9l4 4v14H6z M14 3v5h5 M9 12h7 M9 16h5"/></svg>Sources behind decisions</span><span><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><path d="M12 3l8 3v6c0 5-8 9-8 9s-8-4-8-9V6z M8 12l3 3 5-6"/></svg>Human review before action</span></div>
      <section className={s.workflow} id="workflow"><div className={s.sectionHeading}><h2>From “shipment delayed”<br/>to a plan everyone can follow.</h2><p>A shared component connects more than a purchase order. Follow the impact all the way to the customer.</p></div><ol className={s.workflowSteps}><li><div className={s.stepVisual}><span className={s.mailLine}/><span className={s.mailLine}/><div className={s.dateShift}><span>20 Oct</span><Arrow/><strong>05 Nov</strong></div><span className={s.miniTag}>Supplier update received</span></div><h3>Start with the signal.</h3><p>Record a revised arrival or import a text notice. Keep the original source and review the date before changing the plan.</p></li><li><div className={`${s.stepVisual} ${s.stepConnections}`}><span>Kestrel</span><i/><span>M14 motor</span><i/><div><strong>SO-1041</strong><strong>SO-1042</strong></div></div><h3>Follow every connection.</h3><p>Trace the affected products and orders. See calculated shortages, supporting evidence, and the person who owns the response.</p></li><li><div className={s.stepVisual}><div className={s.reviewLine}><span className={s.avatarPreview}>AC</span><div><strong>Ari Chen</strong><span>Response owner · SO-1041</span></div></div><div className={s.reviewStates}><span>Needs review</span><Arrow/><strong>Decision recorded</strong></div></div><h3>Make the next move clear.</h3><p>Review a response, save the decision, and record recovery. The plan updates. The reasoning stays with it.</p></li></ol></section>
      <CompanyBrain/>
      <section className={s.walkthrough} id="walkthrough"><div className={s.sectionHeading}><h2>Meet your next<br/>operations workspace.</h2><div><p>One minute. One supplier disruption. The full path from a source note to a reviewed response.</p><p className={s.recordingNote}>Recorded core workflow · fictional company data</p></div></div><div className={s.videoFrame}><video controls playsInline preload="none" poster="/media/walkthrough.jpg" aria-label="OpsRelay 60-second core workflow walkthrough"><source src="https://raw.githubusercontent.com/Kartik2004sharma/OpsRelay/main/demo/opsrelay-walkthrough.mp4" type="video/mp4"/><track kind="captions" src="/media/walkthrough.vtt" srcLang="en" label="English" default/>Your browser cannot play this video. <a href="https://youtu.be/4RMUWoru3es">Watch on YouTube</a>.</video></div><div className={s.videoCaption}><span>Trace the impact. Inspect the source. Review the response.</span><a className={s.textLink} href="https://youtu.be/4RMUWoru3es" target="_blank" rel="noreferrer">Watch on YouTube <Arrow diagonal/></a></div></section>
      <section className={s.foundation}><h2>Built around connections.<br/>Open to inspection.</h2><div><p>FalkorDB stores the relationships and operational state behind the workspace. The graph drives the impact analysis, evidence paths, and decision history.</p><p>Explore the source, inspect the query contracts, or run the project with your own database.</p><a className={s.textLink} href={repository} target="_blank" rel="noreferrer">Explore the project on GitHub <Arrow diagonal/></a></div></section>
      <section className={s.faq} id="questions"><h2>A few things<br/>worth knowing.</h2><div>{questions.map(([question, answer]) => <details key={question}><summary>{question}<span className={s.faqPlus} aria-hidden="true"/></summary><p>{answer}</p></details>)}<Link className={s.textLink} href="/trust">Read trust & boundaries <Arrow/></Link></div></section>
      <section className={s.close}><div><h2>One update.<br/>The whole picture.</h2><p>Follow your first disruption from signal to response.</p></div><div><DemoButton label="Try OpsRelay"/><span>No signup · No customer messages sent</span></div></section>
    </main><SiteFooter/>
  </div>;
}

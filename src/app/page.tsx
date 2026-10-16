"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import type { getState } from "@/lib/ops";

type State = Awaited<ReturnType<typeof getState>>;
type Answer = { answer: string; mode: string; sources: string[] };

function date(value: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}

function sourceLabel(id: string) {
  return /^SRC-[a-f0-9-]{36}$/.test(id) ? "Supplier update" : id;
}

export default function Home() {
  const [state, setState] = useState<State | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [arrivalDate, setArrivalDate] = useState("2026-11-05");
  const [note, setNote] = useState("Kestrel confirmed the M14 shipment is delayed by a line inspection.");
  const [updateKind, setUpdateKind] = useState<"delay" | "recovery">("delay");
  const [selectedOrder, setSelectedOrder] = useState("SO-1041");
  const [selectedSource, setSelectedSource] = useState("");
  const sourceDialog = useRef<HTMLDialogElement>(null);
  const [question, setQuestion] = useState("Which customer commitments are at risk and why?");
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [reviewer, setReviewer] = useState("Operations lead");

  useEffect(() => {
    if (selectedSource) sourceDialog.current?.showModal();
  }, [selectedSource]);

  useEffect(() => {
    fetch("/api/ops", { cache: "no-store" }).then(async (response) => {
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      setState(body);
    }).catch((cause) => setError(cause.message || "Could not load the company graph."));
  }, []);

  async function mutate(payload: Record<string, unknown>, label: string) {
    setBusy(label);
    setError("");
    try {
      const response = await fetch("/api/ops", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "The operation failed.");
      if (payload.kind === "ask") setAnswer(body);
      else { setState(body); setAnswer(null); }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The operation failed.");
    } finally { setBusy(""); }
  }

  function submitUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    mutate({ kind: updateKind, arrivalDate, note }, updateKind);
  }

  const current = state?.impacts.find((order) => order.id === selectedOrder) || state?.impacts[0];
  const source = state?.sources.find((item) => item.id === selectedSource);
  const supplySources = state?.sources.filter((item) => ["purchase order", "decision", "delay", "recovery"].includes(item.kind)).sort((a, b) => b.recordedAt.localeCompare(a.recordedAt));

  return <div className="shell">
    <aside className="sidebar" aria-label="Main navigation">
      <a href="#overview" className="brand"><span className="brand-icon">or</span><span>ops<span className="brand-accent">relay</span><small>COMPANY INTELLIGENCE</small></span></a>
      <div className="workspace"><span className="workspace-icon">N</span><span><strong>Northstar Works</strong><small>Synthetic workspace</small></span></div>
      <span className="nav-label">WORKSPACE</span>
      <nav><a href="#overview" className="active">◫ <span>Overview</span></a><a href="#impact">⌁ <span>Impact analysis</span></a><a href="#evidence">◇ <span>Evidence graph</span></a><a href="#actions">☑ <span>Review queue</span></a></nav>
      <div className="sidebar-foot"><i/> FalkorDB context layer<small>Live graph · synthetic data</small></div>
    </aside>
    <main id="overview" className="main">
      <header className="topbar"><span>Northstar Works <b>/</b> Operations <b>/</b> Overview</span><span className="live"><i/> Live graph <b>|</b> Company Brain · Graph Hacks 2026</span></header>
      <div className="content">
        <div className="hero"><div><p className="eyebrow">OPERATIONS COMMAND CENTER</p><h1>Know what a delay<br/><em>really affects.</em></h1><p>One supplier update. Every connected commitment, owner, and next step—grounded in your company graph.</p></div><div className="hero-art" aria-hidden="true"><i/><i/><i/></div></div>
        {error && <div className="error" role="alert"><strong>Needs attention</strong><span>{error}</span><button type="button" onClick={() => setError("")} aria-label="Dismiss error">×</button></div>}
        {!state ? <div className="loading" role="status">{error ? "Company graph is unavailable." : "Connecting to the company graph…"}</div> : <>
          <section className="metrics" aria-label="Current metrics">
            <div><small>AT-RISK ORDERS</small><strong className={state.impactedCount ? "risk-text" : ""}>{String(state.impactedCount).padStart(2, "0")}</strong><span>{state.impactedCount ? "Require review" : "All commitments covered"}</span></div>
            <div><small>TRACKED COMMITMENTS</small><strong>{String(state.impacts.length).padStart(2, "0")}</strong><span>Across {new Set(state.impacts.map((order) => order.customer)).size} customers</span></div>
            <div><small>OPEN REVIEW TASKS</small><strong>{String(state.actions.filter((action) => action.status === "proposed").length).padStart(2, "0")}</strong><span>Human approval required</span></div>
            <div><small>CURRENT SUPPLY ETA</small><strong className="eta">{date(state.currentDate)}</strong><span>{state.currentDate === state.plannedDate ? "On original plan" : `Original: ${date(state.plannedDate)}`}</span></div>
          </section>
          <div className="grid">
            <div className="left-col">
              <section className="panel signal"><div className="panel-head"><div><p className="eyebrow">LIVE SUPPLIER SIGNAL</p><h2>{state.supplier}</h2></div><span className={`pill ${state.impactedCount ? "risk" : "clear"}`}>{state.impactedCount ? "DISRUPTION ACTIVE" : "ON SCHEDULE"}</span></div><div className="signal-line"><span className="part-icon">M14</span><div><strong>{state.component}</strong><small>Shared by Atlas Conveyor and Boreal Sorter</small></div><div className="signal-numbers"><span><small>ON HAND</small>{state.stockQuantity} units</span><span><small>INBOUND</small>{state.supplyQuantity} units</span><span><small>ARRIVAL</small>{date(state.currentDate)}</span></div></div><div className="signal-foot"><i/> Sourced from purchase order and supplier updates <button type="button" onClick={() => setSelectedSource(state.currentSourceId)}>View source ↗</button></div></section>
              <section className="panel" id="impact"><div className="panel-head"><div><p className="eyebrow">CONNECTED IMPACT</p><h2>Customer commitments</h2></div><span className="meta">{state.impacts.length} orders traced</span></div><div className="orders">{state.impacts.map((order) => <button type="button" key={order.id} className={current?.id === order.id ? "selected" : ""} aria-pressed={current?.id === order.id} onClick={() => setSelectedOrder(order.id)}><span className={`status-icon ${order.status}`}>{order.status === "at-risk" ? "!" : "✓"}</span><span className="order-name"><strong>{order.id} <span>{order.customer}</span></strong><small>{order.product} · Due {date(order.dueDate)}</small></span><span className="order-qty"><strong>{order.covered}/{order.required}</strong><small>motors covered</small></span><span className={`order-pill ${order.status}`}>{order.status === "at-risk" ? `${order.shortage} short` : "Covered"}</span></button>)}</div></section>
              <section className="panel evidence" id="evidence"><div className="panel-head"><div><p className="eyebrow">EXPLAINABLE CONTEXT</p><h2>Why {current?.id} is {current?.status === "at-risk" ? "at risk" : "covered"}</h2></div><span className="meta">{current?.sourceIds.length} sources</span></div>{current && <><p>{current.required} motors required by {date(current.dueDate)}. {current.covered} covered from available inventory and supply arriving by that date. {current.shortage ? `${current.shortage} remain uncovered.` : "No shortage under the current plan."}</p><small className="path-label">GRAPH PATH RETURNED BY CYPHER</small><div className="path">{current.path.map((part, index) => <span key={`${part}-${index}`}>{part}{index < current.path.length - 1 && <b>→</b>}</span>)}</div><div className="evidence-foot"><div><small>RESPONSE OWNER</small><strong>{current.owner || "Owner not recorded"}</strong></div><div><small>SUPPORTING RECORDS</small><div className="source-links">{current.sourceIds.map((id) => <button type="button" key={id} onClick={() => setSelectedSource(id)}>{sourceLabel(id)} ↗</button>)}</div></div></div></>}</section>
              <section className="panel provenance"><div className="panel-head"><div><p className="eyebrow">FACTS AND UNCERTAINTY</p><h2>Which source controls the answer?</h2></div></div><div className="provenance-body"><p>The latest recorded supplier update controls the current arrival date. Earlier plans remain visible as superseded evidence. Order coverage is an inference from those facts; review tasks are recommendations.</p><small className="graph-updated" data-testid="graph-updated">Last graph update: {state.lastUpdatedAt ? new Date(state.lastUpdatedAt).toLocaleString("en-GB", { timeZone: "UTC" }) : "Unknown"} UTC</small>{!current?.owner && <p className="ownership-gap">Ownership gap: no responsible person is recorded for {current?.id}. Assign an owner before customer outreach.</p>}<div className="source-history">{supplySources?.map((record) => <button type="button" key={record.id} onClick={() => setSelectedSource(record.id)}><strong>{record.title}</strong><span>{record.status} ↗</span></button>)}</div></div></section>
            </div>
            <div className="right-col">
              <section className="panel update"><div className="panel-head"><div><p className="eyebrow">UPDATE THE GRAPH</p><h2>New supply signal</h2></div><span className="panel-mark">↗</span></div><div className="switch" role="group" aria-label="Update type"><button type="button" aria-pressed={updateKind === "delay"} onClick={() => { setUpdateKind("delay"); setArrivalDate("2026-11-05"); }}>Record delay</button><button type="button" aria-pressed={updateKind === "recovery"} onClick={() => { setUpdateKind("recovery"); setArrivalDate("2026-10-20"); }}>Record recovery</button></div><form onSubmit={submitUpdate}><label>Revised arrival date<input type="date" required value={arrivalDate} onChange={(event) => setArrivalDate(event.target.value)}/></label><label>Source note<textarea rows={3} minLength={8} maxLength={280} required value={note} onChange={(event) => setNote(event.target.value)}/></label><p>This becomes a dated source record in FalkorDB. Impact is recalculated from connected orders.</p><button className="primary" disabled={Boolean(busy)}>{busy === updateKind ? "Saving to graph…" : updateKind === "delay" ? "Record supplier delay ↗" : "Record recovery ↗"}</button></form></section>
              <section className="panel ask"><div className="panel-head"><div><p className="eyebrow">ASK THE COMPANY BRAIN</p><h2>What should we know?</h2></div><span className="panel-mark purple">✦</span></div><form onSubmit={(event) => { event.preventDefault(); mutate({ kind: "ask", question }, "ask"); }}><label className="sr-only" htmlFor="question">Question about company commitments</label><textarea id="question" rows={3} minLength={8} maxLength={300} value={question} onChange={(event) => setQuestion(event.target.value)}/><button disabled={Boolean(busy)}>{busy === "ask" ? "Following graph paths…" : "Ask OpsRelay ↗"}</button></form>{answer && <div className="answer" role="status"><small>{answer.mode.toUpperCase()}</small><p>{answer.answer}</p><div className="source-links">{answer.sources.map((id) => <button type="button" key={id} onClick={() => setSelectedSource(id)}>{sourceLabel(id)} ↗</button>)}</div></div>}</section>
              <section className="panel actions" id="actions"><div className="panel-head"><div><p className="eyebrow">HUMAN APPROVAL</p><h2>Review queue</h2></div><span className="meta">{state.actions.length} total</span></div>{!state.actions.length ? <p className="empty">Actions appear when a delay threatens a commitment.</p> : <><label className="reviewer">Reviewer name<input value={reviewer} maxLength={60} onChange={(event) => setReviewer(event.target.value)}/></label><div className="action-list">{state.actions.map((action) => <div key={action.id}><strong>{action.title}</strong><small>{action.status === "proposed" ? "Draft · approval required" : action.status === "superseded" ? "Closed after recovery" : `${action.status} by ${action.reviewer}`}</small>{action.status === "proposed" && <p><button disabled={Boolean(busy)} type="button" onClick={() => mutate({ kind: "review", id: action.id, decision: "approved", reviewer }, "review")}>Approve</button><button disabled={Boolean(busy)} type="button" onClick={() => mutate({ kind: "review", id: action.id, decision: "rejected", reviewer }, "review")}>Reject</button></p>}</div>)}</div></>}</section>
            </div>
          </div>
          <section className="timeline"><div><p className="eyebrow">GRAPH MEMORY</p><h2>Supply history</h2><p>Updates remain traceable as the current answer changes.</p></div><div>{state.events.length ? state.events.map((event) => <button type="button" key={event.id} onClick={() => setSelectedSource(event.sourceId)}><strong>{event.kind === "delay" ? "Delay reported" : "Recovery confirmed"}</strong><small>Arrival {date(event.arrivalDate)} · {event.note}</small></button>) : <div><strong>Original supply plan</strong><small>{state.supplyQuantity} motors expected {date(state.plannedDate)}</small></div>}</div></section>
        </>}
        <footer>OpsRelay · Synthetic company demonstration for Graph Hacks 2026 <span>Powered by FalkorDB</span></footer>
      </div>
    </main>
    {source && <dialog ref={sourceDialog} className="drawer" aria-labelledby="source-title" onClose={() => setSelectedSource("")}><button type="button" className="close" aria-label="Close source record" onClick={() => sourceDialog.current?.close()}>×</button><p className="eyebrow">SOURCE RECORD · {source.id}</p><h2 id="source-title">{source.title}</h2><div className="source-tags"><span>{source.kind}</span><span>{source.status}</span></div><p>{source.body}</p><small>Recorded {new Date(source.recordedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" })} UTC</small><hr/><small>Fictional company data, stored in the OpsRelay graph.</small></dialog>}
  </div>;
}

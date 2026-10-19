"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import type { getState } from "@/lib/ops";
import BrainWorkspace from "../BrainWorkspace";

type State = Awaited<ReturnType<typeof getState>> & { actor: string; demo: boolean };
type Answer = { answer: string; mode: string; sources: string[] };
const navItems = [["overview", "Overview"], ["impact", "Commitments"], ["evidence", "Evidence & sources"], ["actions", "Review queue"], ["history", "Activity"], ["brain", "Company knowledge"]];

function Icon({ name = "grid", size = 18 }: { name?: string; size?: number }) {
  const paths: Record<string, string> = {
    grid: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
    graph: "M6 6l12 6M6 18l12-6M6 6v12 M9 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0 M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0 M21 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0",
    box: "M3 7l9-4 9 4v10l-9 4-9-4z M3 7l9 4 9-4 M12 11v10",
    check: "M5 12l4 4L19 6", arrow: "M5 12h14 M13 6l6 6-6 6",
    clock: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0 M12 7v5l3 2",
    refresh: "M20 7v5h-5 M4 17v-5h5 M6 6a8 8 0 0 1 13 2 M18 18A8 8 0 0 1 5 16",
    file: "M14 3H5v18h14V8z M14 3v5h5 M8 12h8 M8 16h6",
    close: "M6 6l12 12 M6 18L18 6", shield: "M12 3l8 3v6c0 5-8 9-8 9s-8-4-8-9V6z M8 12l3 3 5-6",
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name] || paths.grid}/></svg>;
}
function date(value: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}
function shifted(value: string, days: number) { const day = new Date(`${value}T00:00:00Z`); day.setUTCDate(day.getUTCDate() + days); return day.toISOString().slice(0, 10); }
function sourceLabel(id: string) { return /^SRC-[a-f0-9-]{36}$/.test(id) ? "Supplier update" : id; }
async function api(path: string, body?: Record<string, unknown>) {
  const response = await fetch(path, { method: body ? "POST" : "GET", cache: "no-store", signal: AbortSignal.timeout(45_000), ...(body ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {}) }).catch(() => { throw new Error("Could not reach the service. It may be waking up. Wait a moment, then try again."); });
  const data = await response.json().catch(() => ({ error: "The service is starting. Please try again in a moment." }));
  return { response, data };
}

export default function Workspace() {
  const [state, setState] = useState<State | null>(null);
  const [signedOut, setSignedOut] = useState(false);
  const [password, setPassword] = useState("");
  const [operatorForm, setOperatorForm] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState("");
  const [arrivalDate, setArrivalDate] = useState("2026-11-05");
  const [note, setNote] = useState("Kestrel confirmed the M14 shipment is delayed by a line inspection.");
  const [updateKind, setUpdateKind] = useState<"delay" | "recovery">("delay");
  const [selectedOrder, setSelectedOrder] = useState("SO-1041");
  const [selectedSource, setSelectedSource] = useState("");
  const [activeNav, setActiveNav] = useState("overview");
  const sourceDialog = useRef<HTMLDialogElement>(null);
  const [question, setQuestion] = useState("Which customer commitments are at risk and why?");
  const [answer, setAnswer] = useState<Answer | null>(null);

  useEffect(() => { if (selectedSource) sourceDialog.current?.showModal(); }, [selectedSource]);
  const loadWorkspace = useCallback(() => api("/api/ops").then(({ response, data }) => {
    if (response.status === 401) { setSignedOut(true); setState(null); setSelectedSource(""); return false; }
    if (!response.ok) throw new Error(data.error);
    setState(data); setSignedOut(false); setError(""); setArrivalDate(shifted(data.currentDate, 16)); setUpdateKind("delay");
    return true;
  }).catch((cause) => { setError(cause instanceof Error && cause.name !== "TimeoutError" ? cause.message : "The free service is waking up. Wait a moment, then retry."); return false; }), []);
  useEffect(() => { void loadWorkspace(); }, [loadWorkspace]);

  async function enter(demo: boolean, event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault(); setBusy(demo ? "demo" : "login"); setError(""); setNotice("");
    try {
      const { response, data } = await api("/api/session", demo ? { kind: "demo" } : { password });
      if (!response.ok) throw new Error(data.error);
      setPassword(""); await loadWorkspace();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not open the workspace. Try again."); }
    finally { setBusy(""); }
  }
  async function signOut() {
    setBusy("logout");
    try {
      const { response, data } = await api("/api/session", { kind: "logout" });
      if (!response.ok) throw new Error(data.error);
      setState(null); setAnswer(null); setSelectedSource(""); setSignedOut(true); setNotice(""); setError("");
    } catch { setError("Sign-out failed. Please try again."); }
    finally { setBusy(""); }
  }
  async function mutate(payload: Record<string, unknown>, label: string) {
    setBusy(label); setError(""); setNotice("");
    try {
      const { response, data } = await api("/api/ops", payload);
      if (response.status === 401) { setSignedOut(true); setState(null); setAnswer(null); }
      if (!response.ok) throw new Error(data.error || "The operation failed.");
      if (payload.kind === "ask") setAnswer(data);
      else {
        setState(data); setAnswer(null);
        if (payload.kind === "delay") setArrivalDate(shifted(data.currentDate, 16));
        if (payload.kind === "recovery") setArrivalDate(shifted(data.currentDate, -1));
        setNotice(payload.kind === "review" ? `Decision recorded as ${payload.decision}.` : `${payload.kind === "delay" ? "Supplier delay" : "Recovery"} recorded. ${data.impactedCount} commitments at risk.`);
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : "The operation failed."); }
    finally { setBusy(""); }
  }
  function chooseUpdate(kind: "delay" | "recovery") {
    setUpdateKind(kind);
    setArrivalDate(kind === "delay" ? shifted(state?.currentDate || "2026-10-20", 16) : state && state.currentDate > state.plannedDate ? state.plannedDate : shifted(state?.currentDate || "2026-10-20", -1));
    setNote(kind === "delay" ? "Kestrel confirmed the M14 shipment is delayed by a line inspection." : "Kestrel confirmed an earlier shipment date after resolving the line inspection.");
  }
  const current = state?.impacts.find((order) => order.id === selectedOrder) || state?.impacts[0];
  const source = state?.sources.find((item) => item.id === selectedSource);
  const supplySources = state?.sources.filter((item) => ["purchase order", "decision", "delay", "recovery"].includes(item.kind)).sort((a, b) => b.recordedAt.localeCompare(a.recordedAt));
  const pending = state?.actions.filter((action) => action.status === "proposed").length || 0;
  const risk = Boolean(state?.impactedCount);
  const products = [...new Set(state?.impacts.map((order) => order.product))];

  return <div className={`shell ${!state ? "entry-shell" : ""}`}>
    <a className="skip-link" href="#main-content">Skip to workspace</a>
    <aside className="sidebar" aria-label="Main navigation">
      <Link href="/" className="brand" aria-label="OpsRelay home"><span className="brand-symbol"><Icon name="graph" size={22}/></span><strong>opsrelay<span>.</span></strong></Link>
      <div className="workspace"><span className="workspace-icon">N</span><span><strong>Northstar Works</strong><small>{state?.demo ? "Demo workspace" : "Company workspace"}</small></span></div>
      <nav aria-label="Workspace sections">{navItems.map(([id, label], index) => <a key={id} href={`#${id}`} aria-label={label} className={activeNav === id ? "active" : ""} aria-current={activeNav === id ? "location" : undefined} onClick={() => setActiveNav(id)}><Icon name={["grid", "box", "graph", "check", "clock"][index]}/><span>{label}</span>{id === "actions" && pending > 0 && <b>{pending}</b>}</a>)}</nav>
      <div className="sidebar-foot"><span className="connection-dot"/> FalkorDB connected<small>Synthetic company data</small><a href="https://github.com/Kartik2004sharma/OpsRelay" target="_blank" rel="noreferrer">View project source <Icon name="arrow" size={14}/></a></div>
    </aside>
    <main id="main-content" className="main">
      <header className="topbar"><span>{state ? <>Workspace <span className="slash">/</span> <strong>Supply operations</strong></> : <Link className="entry-brand" href="/"><Icon name="graph" size={23}/>opsrelay.</Link>}</span><div>{state && <><span className="session-label">{state.demo ? "Demo reviewer" : state.actor}</span><button type="button" className="quiet-button" disabled={Boolean(busy)} onClick={signOut}>{state.demo ? "End demo" : "Sign out"}</button></>}<span className="avatar" aria-hidden="true">{state?.demo ? "D" : "N"}</span></div></header>
      <div className="content" id="overview">
        {error && <div className="error" role="alert"><Icon name="shield"/><div><strong>We couldn’t complete that</strong><p>{error}</p><button type="button" onClick={() => { setBusy("refresh"); void loadWorkspace().finally(() => setBusy("")); }}>Refresh workspace</button></div><button type="button" className="icon-button" onClick={() => setError("")} aria-label="Dismiss error"><Icon name="close"/></button></div>}
        <div className="notice" role="status" aria-live="polite">{notice}</div>
        {signedOut ? <div className="entry">
          <section className="entry-copy"><h1>One delay.<br/>See the whole impact.</h1><p>Follow a supplier update through the products, customer commitments, and people it affects. Inspect the source behind each answer and see who should respond.</p><div className="entry-route"><span>Kestrel Components</span><Icon name="arrow"/><span>M14 motor</span><Icon name="arrow"/><span>3 commitments</span></div><ul><li><Icon name="check"/> Trace shared dependencies</li><li><Icon name="check"/> Review actions with evidence</li><li><Icon name="check"/> Keep the decision history</li></ul><span className="entry-footnote">Built with FalkorDB · Company Brain / Graph Hacks 2026</span></section>
          <section className="entry-card"><span className="entry-icon"><Icon name="box" size={28}/></span><h2>Try the working company brain</h2><p>Open your own synthetic workspace. Record a delay, inspect the evidence, and review the response.</p><button className="primary" type="button" disabled={Boolean(busy)} onClick={() => enter(true)}>{busy === "demo" ? "Creating your workspace…" : "Explore live demo"}<Icon name="arrow"/></button><p className="entry-help">No password or signup. Separate graph for your session. Demo sessions last one hour; free hosting may reset them earlier.</p><div className="entry-divider"/><button className="text-button" type="button" aria-expanded={operatorForm} onClick={() => setOperatorForm(!operatorForm)}>Operator sign in</button>{operatorForm && <form className="operator-form" onSubmit={(event) => enter(false, event)}><label htmlFor="operator-password">Operator password</label><input id="operator-password" type="password" autoComplete="current-password" required maxLength={256} value={password} onChange={(event) => setPassword(event.target.value)}/><button className="secondary" disabled={Boolean(busy)}>{busy === "login" ? "Signing in…" : "Sign in"}</button><small>Use the password configured by the workspace owner.</small></form>}</section>
        </div> : !state ? <section className="loading" aria-busy="true" aria-label="Loading workspace"><div className="skeleton wide"/><div className="skeleton short"/><div className="skeleton chart"/><p>Connecting to the company graph. Free hosting can take a moment to wake up.</p><button className="secondary" type="button" onClick={loadWorkspace}>Try again</button></section> : <>
          <div className="page-heading"><div><h1>Supply overview</h1><p>From supplier signal to customer response.</p></div><div className="heading-actions"><a className="primary" href="#supply-update"><Icon name="box" size={15}/>Record update</a><button type="button" className="secondary refresh" disabled={Boolean(busy)} onClick={() => { setBusy("refresh"); void loadWorkspace().then((loaded) => { if (loaded) setNotice("Workspace refreshed."); }).finally(() => setBusy("")); }}><Icon name="refresh"/>{busy === "refresh" ? "Refreshing…" : "Refresh"}</button></div></div>
          {state.demo && <div className="demo-banner"><Icon name="shield"/><div><strong>Your private demo</strong><span>Changes affect only this session. All company records are fictional.</span></div><span className="badge neutral">1-hour session</span></div>}
          <section className="summary" aria-label="Current metrics"><div><span className={`summary-icon ${risk ? "warning" : "success"}`}><Icon name="shield"/></span><div><strong>{state.impactedCount} at-risk orders</strong><small>{risk ? "Review the affected commitments" : "All commitments covered"}</small></div></div><div><strong>{state.impacts.length} commitments</strong><small>Across {new Set(state.impacts.map((order) => order.customer)).size} customers</small></div><div><strong>{pending} open review tasks</strong><small>Human approval required</small></div><div><small>Current supply ETA</small><strong>{date(state.currentDate)}</strong></div></section>
          <div className="grid"><div className="left-col">
            <section className="panel network" aria-label="Connected supply network"><div className="panel-head"><div><h2>One component. Connected commitments.</h2><p>Follow the relationships behind the current plan.</p></div><span className={`badge ${risk ? "warning" : "success"}`}>{risk ? "DISRUPTION ACTIVE" : "ON SCHEDULE"}</span></div><div className="network-scroll" role="region" aria-label="Supply dependency map, scroll to explore" tabIndex={0}><span className="map-hint">Scroll to explore the full network</span><div className="network-canvas"><svg className="network-lines" viewBox="0 0 720 280" preserveAspectRatio="none" aria-hidden="true"><path d="M145 140H205 M340 140H380V78H405 M380 140V210H405 M540 78H570V46H590 M540 210H570V140H590 M570 210V235H590"/></svg><div className="network-node supplier"><small>Supplier</small><strong>{state.supplier}</strong><span>PO-204 · {state.supplyQuantity} units</span></div><div className={`network-node component ${risk ? "node-warning" : ""}`}><small>Shared component</small><strong>{state.component}</strong><span>{state.stockQuantity} on hand · {state.supplyQuantity} inbound</span></div>{products.map((product, index) => <div className={`network-node product product-${index}`} key={product}><small>Product</small><strong>{product}</strong><span>{state.impacts.filter((order) => order.product === product).length} connected orders</span></div>)}{state.impacts.map((order, index) => <button key={order.id} type="button" className={`network-node graph-order graph-order-${index} ${order.shortage ? "node-warning" : ""} ${current?.id === order.id ? "node-selected" : ""}`} aria-label={`Inspect ${order.id} in graph`} aria-pressed={current?.id === order.id} onClick={() => setSelectedOrder(order.id)}><strong>{order.id}</strong><span>{order.shortage ? `${order.shortage} motors short` : "Covered"}</span></button>)}</div></div><div className="network-footer"><span><span className={`connection-dot ${risk ? "warning-dot" : ""}`}/>{state.supplier} · Arrival {date(state.currentDate)}</span><button type="button" className="text-button" onClick={() => setSelectedSource(state.currentSourceId)}>View source <Icon name="file" size={14}/></button></div></section>
            <section className="panel" id="impact"><div className="panel-head"><h2>Customer commitments</h2><span className="muted">{state.impacts.length} orders traced</span></div><div className="order-table-head"><span>Order / customer</span><span>Coverage</span><span>Status</span></div><div className="orders">{state.impacts.map((order) => <button type="button" key={order.id} className={current?.id === order.id ? "selected" : ""} aria-pressed={current?.id === order.id} onClick={() => setSelectedOrder(order.id)}><span className={`status-icon ${order.status}`}><Icon name={order.shortage ? "clock" : "check"} size={16}/></span><span className="order-name"><strong>{order.id}<span>{order.customer}</span></strong><small>{order.product} · Due {date(order.dueDate)}</small></span><span className="order-qty"><strong>{order.covered}<span> / {order.required}</span></strong><small>motors</small></span><span className={`badge ${order.shortage ? "warning" : "success"}`}>{order.shortage ? `${order.shortage} short` : "Covered"}</span></button>)}</div></section>
            <section className="panel evidence" id="evidence"><div className="panel-head"><h2>Why {current?.id} is {current?.shortage ? "at risk" : "covered"}</h2><span className="badge neutral">{current?.sourceIds.length} sources</span></div>{current && <><p className="evidence-summary">{current.required} motors required by {date(current.dueDate)}. {current.covered} covered from inventory and supply arriving by that date. {current.shortage ? `${current.shortage} remain uncovered.` : "No shortage under the current plan."}</p><div className="path" aria-label="Graph path returned by Cypher">{current.path.map((part, index) => <span key={`${part}-${index}`}>{part}{index < current.path.length - 1 && <Icon name="arrow" size={13}/>}</span>)}</div><div className="evidence-foot"><div><small>Response owner</small><strong>{current.owner || "Owner not recorded"}</strong></div><div><small>Supporting records</small><div className="source-links">{current.sourceIds.map((id) => <button type="button" key={id} onClick={() => setSelectedSource(id)}>{sourceLabel(id)}<Icon name="file" size={12}/></button>)}</div></div></div>{!current.owner && <p className="ownership-gap">Ownership gap: no responsible person is recorded for {current.id}. Assign an owner before customer outreach.</p>}</>}</section>
            <section className="panel provenance"><div className="panel-head"><h2>Source history</h2><span className="muted">Facts & uncertainty</span></div><div className="provenance-body"><p>The latest supplier update controls the arrival date. Earlier plans stay visible as superseded evidence. Coverage is calculated from these facts; review tasks are recommendations.</p><small className="graph-updated" data-testid="graph-updated">Last graph update: {state.lastUpdatedAt ? new Date(state.lastUpdatedAt).toLocaleString("en-GB", { timeZone: "UTC" }) : "Unknown"} UTC</small><div className="source-history">{supplySources?.map((record) => <button type="button" key={record.id} onClick={() => setSelectedSource(record.id)}><Icon name="file"/><strong>{record.title}</strong><span>{record.status}</span><Icon name="arrow" size={15}/></button>)}</div></div></section>
          </div><div className="right-col">
            <section className="panel update" id="supply-update"><div className="panel-head"><div><h2>Record a supply update</h2><p>Recalculate the connected impact.</p></div><Icon name="box"/></div><div className="switch" role="group" aria-label="Update type"><button type="button" aria-pressed={updateKind === "delay"} onClick={() => chooseUpdate("delay")}>Record delay</button><button type="button" aria-pressed={updateKind === "recovery"} onClick={() => chooseUpdate("recovery")}>Record recovery</button></div><form onSubmit={(event) => { event.preventDefault(); void mutate({ kind: updateKind, arrivalDate, note }, updateKind); }}><label>Revised arrival date<input type="date" required value={arrivalDate} onChange={(event) => setArrivalDate(event.target.value)}/></label><span className="field-hint">Current arrival: {date(state.currentDate)}</span><label>Source note<textarea rows={3} minLength={8} maxLength={280} required value={note} onChange={(event) => setNote(event.target.value)}/></label><span className="field-hint">Saved as a dated source record in FalkorDB.</span><button className="primary" disabled={Boolean(busy)}>{busy === updateKind ? "Saving to graph…" : updateKind === "delay" ? "Record supplier delay" : "Record recovery"}<Icon name="arrow" size={16}/></button></form></section>
            <section className="panel ask"><div className="panel-head"><div><h2>Ask the company brain</h2><p>Answers traced to the company graph.</p></div><Icon name="graph"/></div><form onSubmit={(event) => { event.preventDefault(); void mutate({ kind: "ask", question }, "ask"); }}><label htmlFor="question" className="sr-only">Question about company commitments</label><textarea id="question" rows={3} minLength={8} maxLength={300} required value={question} onChange={(event) => setQuestion(event.target.value)}/><div className="suggestions"><button type="button" onClick={() => setQuestion("Who owns the at-risk customer commitments?")}>Who owns the response?</button><button type="button" onClick={() => setQuestion("Why are these orders at risk? Show the source evidence.")}>Explain the risk</button></div><button className="secondary" disabled={Boolean(busy)}>{busy === "ask" ? "Following graph paths…" : "Ask OpsRelay"}<Icon name="arrow" size={16}/></button></form>{answer && <div className="answer" role="status"><small>{answer.mode.toUpperCase()}</small><p>{answer.answer}</p><div className="source-links">{answer.sources.map((id) => <button type="button" key={id} onClick={() => setSelectedSource(id)}>{sourceLabel(id)}</button>)}</div></div>}</section>
            <section className="panel actions" id="actions"><div className="panel-head"><h2>Review queue</h2><span className="badge neutral">{pending} open</span></div>{!state.actions.length ? <div className="empty"><Icon name="check" size={24}/><strong>No actions need review</strong><p>A delay that threatens a commitment creates a response task here. You approve the decision; no customer message is sent.</p></div> : <><p className="reviewer">Reviewing as {state.actor}</p><div className="action-list">{state.actions.map((action) => <div key={action.id}><span className={`action-state ${action.status}`}><Icon name={action.status === "proposed" ? "clock" : "check"} size={14}/>{action.status === "proposed" ? "Needs review" : action.status}</span><strong>{action.title}</strong><small>{action.status === "proposed" ? "Draft response · human approval required" : action.status === "superseded" ? "Closed after supply update" : `${action.status} by ${action.reviewer}`}</small>{action.status === "proposed" && <div className="action-buttons"><button className="primary" disabled={Boolean(busy)} type="button" onClick={() => mutate({ kind: "review", id: action.id, decision: "approved" }, "review")}>Approve</button><button className="secondary" disabled={Boolean(busy)} type="button" onClick={() => mutate({ kind: "review", id: action.id, decision: "rejected" }, "review")}>Reject</button></div>}</div>)}</div></>}</section>
          </div></div>
          <section className="panel timeline" id="history"><div className="panel-head"><h2>Supply activity</h2><span className="muted">History stays in the graph</span></div><div className="timeline-items">{state.events.length ? state.events.map((event) => <button type="button" key={event.id} onClick={() => setSelectedSource(event.sourceId)}><span className="timeline-icon"><Icon name="clock" size={16}/></span><span><strong>{event.kind === "delay" ? "Delay reported" : "Recovery confirmed"}</strong><small>Arrival {date(event.arrivalDate)} · {event.note}</small><small data-testid="event-time">{event.recordedBy || "Operations lead"} · {new Date(event.recordedAt).toLocaleString("en-GB", { timeZone: "UTC" })} UTC</small></span><Icon name="arrow" size={15}/></button>) : <div className="timeline-baseline"><Icon name="clock"/><span><strong>Original supply plan</strong><small>{state.supplyQuantity} motors expected {date(state.plannedDate)}. Record a supply update to start the decision trail.</small></span></div>}</div></section>
          <BrainWorkspace state={state} refresh={loadWorkspace} showSource={setSelectedSource}/>
        </>}
        <footer><span className="footer-brand">opsrelay.</span><span>Synthetic data · No external messages sent</span><span>Powered by FalkorDB</span></footer>
      </div>
    </main>
    {source && <dialog ref={sourceDialog} className="drawer" aria-labelledby="source-title" onClose={() => setSelectedSource("")}><div className="drawer-top"><span><Icon name="file"/> Source record</span><button type="button" className="icon-button" aria-label="Close source record" onClick={() => sourceDialog.current?.close()}><Icon name="close"/></button></div><h2 id="source-title">{source.title}</h2><div className="source-tags"><span className="badge neutral">{source.kind}</span><span className={`badge ${source.status === "current" ? "success" : "neutral"}`}>{source.status}</span></div><p>{source.body}</p><dl><div><dt>Record ID</dt><dd>{source.id}</dd></div><div><dt>Recorded</dt><dd>{new Date(source.recordedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" })} UTC</dd></div></dl><p className="drawer-note">Fictional company data, stored in your OpsRelay graph. Older evidence is retained when a new source supersedes it.</p></dialog>}
  </div>;
}

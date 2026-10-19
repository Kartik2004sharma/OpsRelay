"use client";

import { useCallback, useEffect, useState } from "react";
import type { knowledge } from "@/lib/knowledge";
import type { getState } from "@/lib/ops";

type Knowledge = Awaited<ReturnType<typeof knowledge>> & { agentConfigured: boolean; graphRag?: { configured: boolean; indexed: { id: string; indexedAt: string }[]; sdk: string } };
type Match = { sourceId: string; chunkId: string; text: string; title: string; entities: string[]; historical: boolean };
type State = Awaited<ReturnType<typeof getState>>;

export default function BrainWorkspace({ state, refresh, showSource }: { state: State; refresh: () => Promise<unknown>; showSource: (id: string) => void }) {
  const [data, setData] = useState<Knowledge>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [title, setTitle] = useState("");
  const [question, setQuestion] = useState("Which customer commitments are affected, who owns the response, and what should we review next?");
  const [lesson, setLesson] = useState("");
  const [sourceId, setSourceId] = useState(state.currentSourceId);
  const [orderId, setOrderId] = useState(state.impacts[0]?.id || "");
  const [search, setSearch] = useState("What changed in Kestrel M14 supply?");
  const [matches, setMatches] = useState<Match[]>([]);
  const [searched, setSearched] = useState(false);
  const [dates, setDates] = useState<Record<string, string>>({});
  const load = useCallback(async () => {
    const response = await fetch("/api/brain", { signal: AbortSignal.timeout(15_000) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Company memory could not be loaded.");
    setData(result);
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/brain", { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15_000)]) })
      .then(async (response) => { const result = await response.json(); if (!response.ok) throw new Error(result.error || "Company memory could not be loaded."); return result; })
      .then((result) => { if (!controller.signal.aborted) setData(result); })
      .catch((e) => { if (!controller.signal.aborted) setError(e.message); });
    return () => controller.abort();
  }, [state.revision]);
  async function act(body: Record<string, unknown>) {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/brain", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(90_000) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "The operation could not be completed.");
      if (body.kind === "search_knowledge") { setMatches(result.items); setSearched(true); }
      await refresh(); await load();
      if (body.kind === "import_notice") { setNotice(""); setTitle(""); }
      if (body.kind === "remember") setLesson("");
    } catch (e) { setError(e instanceof Error ? e.message : "Please retry this operation."); }
    finally { setBusy(false); }
  }
  return <section className="panel brain-workspace" id="brain" aria-labelledby="brain-heading">
    <div className="panel-head"><div><h2 id="brain-heading">From evidence to a reviewed response.</h2><p>Investigate connected commitments. Keep the evidence and decisions together.</p></div><span className="badge neutral">{data?.agentConfigured ? "CLOUD AGENT READY" : "AGENT NOT CONFIGURED"}</span></div>
    {error && <div role="alert" className="brain-error">{error}<button type="button" className="text-button" onClick={() => { setError(""); void load().catch((e) => setError(e.message)); }}>Reload memory</button></div>}
    {busy && <p role="status" className="brain-status">Working with the company graph… Cloud investigations can take up to 65 seconds.</p>}
    <div className="knowledge-search">
      <div><h3>Search the company’s evidence</h3><p>GraphRAG SDK connects reviewed notices to their original passages. Search with Gemini embeddings; inspect the source before acting.</p></div>
      <span className="badge neutral">{data?.graphRag?.configured ? `${data.graphRag.indexed.length} DOCUMENTS INDEXED` : "DOCUMENT SEARCH NOT CONFIGURED"}</span>
      <form onSubmit={(e) => { e.preventDefault(); void act({ kind: "search_knowledge", question: search }); }}><label htmlFor="knowledge-query">Search reviewed documents</label><div><input id="knowledge-query" required minLength={3} maxLength={500} value={search} onChange={(e) => setSearch(e.target.value)}/><button className="primary" disabled={busy || !data?.graphRag?.configured}>Search evidence</button></div></form>
      {!data?.graphRag?.indexed.length && <p className="knowledge-hint">Apply a reviewed supplier notice, then choose “Index reviewed evidence” below. Supply facts always come from the operational graph.</p>}
      {searched && <p role="status">{matches.length ? `${matches.length} verified ${matches.length === 1 ? "passage" : "passages"} found.` : "No verified passages found. Index a reviewed notice or try a different question."}</p>}
      {matches.map((item) => <article className="knowledge-match" key={item.chunkId}><div><h4>{item.title}</h4><span className="badge neutral">{item.historical ? "HISTORICAL EVIDENCE" : "REVIEWED EVIDENCE"}</span></div><blockquote>{item.text}</blockquote>{item.entities.length > 0 && <p>Connected entities: {item.entities.join(" · ")}</p>}<button type="button" className="text-button" onClick={() => showSource(item.sourceId)}>Read original source</button></article>)}
    </div>
    <div className="brain-grid">
      <div className="brain-card"><h3>Investigate with the agent</h3><p>The cloud model reads bounded graph tools. Citations must come from returned records. Recommendations still need your review.</p>
        <form onSubmit={(e) => { e.preventDefault(); void act({ kind: "investigate", question }); }}><label>Investigation question<textarea required minLength={8} maxLength={500} value={question} onChange={(e) => setQuestion(e.target.value)}/></label><button className="primary" disabled={busy || !data?.agentConfigured}>Run cloud investigation</button></form>
        {data?.investigations.map((run) => <article className="brain-record" key={run.id}><h4>{run.question}</h4><small>Revision {run.revision} · {run.model}{run.revision !== state.revision && " · Historical analysis — supply has changed"}</small><p>{run.summary}</p><div className="source-links">{(run.sourceIds as string[]).map((id) => <button type="button" key={id} onClick={() => showSource(id)}>{state.sources.find((source) => source.id === id)?.title || id}</button>)}</div><ul>{(run.nextSteps as string[]).map((step, i) => <li key={i}>{step}</li>)}</ul><details><summary>See graph tool trace</summary><pre>{JSON.stringify(run.trace, null, 2)}</pre></details></article>)}
      </div>
      <div className="brain-card"><h3>Review a supplier notice</h3><p>Text notices for Kestrel’s M14 supply. Importing a notice does not change the plan. Choose a date from the original and review it first.</p>
        <form onSubmit={(e) => { e.preventDefault(); void act({ kind: "import_notice", title, body: notice }); }}>
          <label>Notice title<input required minLength={4} maxLength={100} value={title} onChange={(e) => setTitle(e.target.value)}/></label>
          <label>Load a text notice<input type="file" accept=".txt,.md,text/plain,text/markdown" onChange={async (e) => { const file = e.target.files?.[0]; if (!file) return; if (file.size > 8000) { setError("Choose a text file smaller than 8 KB."); return; } setNotice(await file.text()); if (!title) setTitle(file.name.slice(0, 100)); }}/></label>
          <label>Original notice<textarea required minLength={30} maxLength={8000} rows={4} placeholder="Kestrel update for M14: revised arrival 2026-10-25…" value={notice} onChange={(e) => setNotice(e.target.value)}/></label><small>Only import information you may share with the cloud model. Use ISO dates (YYYY-MM-DD). PDF and image extraction are not supported.</small><button className="secondary" disabled={busy}>Import for review</button>
        </form>
        {data?.documents.map((doc) => <article className="brain-record" key={doc.id}><h4>{doc.title}</h4><span className="badge neutral">{doc.status}</span>{doc.status === "applied" && <div className="document-index"><button type="button" className="text-button" disabled={busy || !data?.graphRag?.configured || data.graphRag.indexed.some((item) => item.id === doc.id)} onClick={() => act({ kind: "index_document", id: doc.id })}>{data?.graphRag?.indexed.some((item) => item.id === doc.id) ? "Indexed with GraphRAG SDK" : "Index reviewed evidence"}</button><small>Indexing sends this reviewed text to Gemini for extraction and embeddings.</small></div>}<details><summary>Read original notice</summary><p className="preserve-text">{doc.body}</p></details>{doc.status === "pending" && <><label>Candidate arrival date<select value={dates[doc.id] || doc.dates[0]} onChange={(e) => setDates({ ...dates, [doc.id]: e.target.value })}>{doc.dates.map((date) => <option key={date}>{date}</option>)}</select></label><small>Imported against revision {doc.revision}{doc.revision !== state.revision && " — stale; reject and import a current notice"}.</small><div className="action-buttons"><button type="button" className="primary" disabled={busy || doc.revision !== state.revision} onClick={() => act({ kind: "review_notice", id: doc.id, decision: "apply", arrivalDate: dates[doc.id] || doc.dates[0] })}>Apply reviewed date</button><button type="button" className="secondary" disabled={busy} onClick={() => act({ kind: "review_notice", id: doc.id, decision: "reject" })}>Reject notice</button></div></>}</article>)}
      </div>
      <div className="brain-card"><h3>Keep a source-linked lesson</h3><p>Human notes survive reloads in this workspace’s graph. The agent can retrieve them as historical context.</p><form onSubmit={(e) => { e.preventDefault(); void act({ kind: "remember", text: lesson, sourceId }); }}><label>Lesson learned<textarea required minLength={12} maxLength={500} value={lesson} onChange={(e) => setLesson(e.target.value)}/></label><label>Supporting source<select value={sourceId} onChange={(e) => setSourceId(e.target.value)}>{state.sources.map((s) => <option key={s.id} value={s.id}>{s.title} ({s.status})</option>)}</select></label><button className="secondary" disabled={busy}>Save lesson</button></form>{data?.lessons.map((item) => <article className="brain-record" key={item.id}><p>{item.text}</p><small>Recorded by {item.actor}</small><button className="text-button" type="button" onClick={() => showSource(item.sourceId)}>View supporting source</button></article>)}</div>
      <div className="brain-card"><h3>Prepare a customer response</h3><p>Drafts use the calculated allocation. Approving makes a draft downloadable; it never sends a message.</p><form onSubmit={(e) => { e.preventDefault(); void act({ kind: "create_draft", orderId }); }}><label>Customer commitment<select value={orderId} onChange={(e) => setOrderId(e.target.value)}>{state.impacts.map((order) => <option key={order.id} value={order.id}>{order.id} · {order.customer}</option>)}</select></label><button className="secondary" disabled={busy}>Prepare response draft</button></form>{data?.drafts.map((draft) => <article className="brain-record" key={draft.id}><h4>{draft.orderId} response</h4><small>{draft.status} · Revision {draft.revision}{draft.revision !== state.revision && " · Historical — supply changed"}</small><details><summary>Read response draft</summary><p className="preserve-text">{draft.body}</p></details>{draft.status === "proposed" && <div className="action-buttons"><button type="button" className="primary" disabled={busy || draft.revision !== state.revision} onClick={() => act({ kind: "review_draft", id: draft.id, decision: "approved" })}>Approve draft</button><button type="button" className="secondary" disabled={busy} onClick={() => act({ kind: "review_draft", id: draft.id, decision: "rejected" })}>Reject draft</button></div>}{draft.status === "approved" && draft.revision === state.revision && <button type="button" className="text-button" onClick={() => { const url = URL.createObjectURL(new Blob([draft.body], { type: "text/plain" })); const a = document.createElement("a"); a.href = url; a.download = `${draft.orderId}-reviewed-response.txt`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }}>Download reviewed draft</button>}</article>)}</div>
    </div>
  </section>;
}

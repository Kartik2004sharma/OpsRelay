export type ToolCall = { name: string; args?: Record<string, unknown> };
export type ModelContent = { role: string; parts: { text?: string; functionCall?: ToolCall; functionResponse?: { name: string; response: unknown }; [key: string]: unknown }[] };
export type AgentResult = { summary: string; sourceIds: string[]; nextSteps: string[] };
export type ToolResult = { data: unknown; sourceIds: string[] };

export function parseConclusion(args: Record<string, unknown>, observed: Set<string>): AgentResult {
  if (typeof args.summary !== "string" || args.summary.length < 20 || args.summary.length > 3000) throw new Error("The agent did not return a usable conclusion.");
  if (!Array.isArray(args.sourceIds) || !args.sourceIds.length || args.sourceIds.length > 20 || args.sourceIds.some((id) => typeof id !== "string" || !observed.has(id))) throw new Error("The agent returned unsupported citations.");
  if (!Array.isArray(args.nextSteps) || args.nextSteps.length > 5 || args.nextSteps.some((step) => typeof step !== "string" || step.length > 500)) throw new Error("The agent returned invalid next steps.");
  return { summary: args.summary, sourceIds: [...new Set(args.sourceIds)] as string[], nextSteps: args.nextSteps as string[] };
}

export async function runToolLoop(
  question: string,
  model: (contents: ModelContent[]) => Promise<ModelContent>,
  execute: (call: ToolCall) => Promise<ToolResult>,
) {
  const contents: ModelContent[] = [{ role: "user", parts: [{ text: question }] }];
  const observed = new Set<string>();
  const trace: { tool: string; args: Record<string, unknown>; sourceIds: string[] }[] = [];
  const seen = new Set<string>();
  let calls = 0;
  let contextBytes = 0;
  let citationRepair = false;
  turns: for (let round = 0; round < 4; round++) {
    const reply = await model(contents);
    if (reply.role !== "model" || !Array.isArray(reply.parts)) throw new Error("The model returned an invalid turn.");
    const tools = reply.parts.flatMap((part) => part.functionCall ? [part.functionCall] : []);
    if (!tools.length || tools.length > 4) throw new Error("The agent must use graph tools before concluding.");
    contents.push(reply);
    const responses: ModelContent["parts"] = [];
    for (const call of tools) {
      if (++calls > 8) throw new Error("The agent reached its eight-tool budget.");
      const args = call.args || {};
      if (!args || typeof args !== "object" || Array.isArray(args)) throw new Error("The agent returned invalid tool arguments.");
      if (call.name === "finish") {
        if (responses.length || tools.length !== 1) throw new Error("The agent must conclude in a separate turn after reading tool results.");
        try { return { ...parseConclusion(args, observed), trace, citationRepair }; }
        catch (error) {
          if (!observed.size || citationRepair || round >= 3) throw error;
          citationRepair = true;
          contents.push({ role: "user", parts: [{ functionResponse: { name: "finish", response: { error: "Conclusion failed validation. Return a corrected finish call using only these sourceIds, a 20–3000 character summary, and up to five nextSteps. No new facts.", allowedSourceIds: [...observed] } } }] });
          continue turns;
        }
      }
      const signature = JSON.stringify(call);
      if (seen.has(signature)) throw new Error("The agent repeated a tool call; stopped to prevent a loop.");
      seen.add(signature);
      const result = await execute(call);
      contextBytes += new TextEncoder().encode(JSON.stringify(result.data)).byteLength;
      if (contextBytes > 48_000) throw new Error("The agent reached its graph context budget.");
      result.sourceIds.forEach((id) => observed.add(id));
      trace.push({ tool: call.name, args, sourceIds: result.sourceIds });
      responses.push({ functionResponse: { name: call.name, response: result.data } });
    }
    contents.push({ role: "user", parts: responses });
  }
  throw new Error("The agent reached its four-turn budget without a verified conclusion.");
}

import { graph } from "@/lib/graph";
import { json } from "@/lib/http";

export async function GET() {
  try {
    if (!process.env.OPSRELAY_OPERATOR_PASSWORD || process.env.OPSRELAY_OPERATOR_PASSWORD.length < 20) return json({ status: "unavailable" }, 503);
    const result = await (await graph()).roQuery<{ count: number }>("MATCH (:Supply {id:'DEL-204'}) RETURN count(*) AS count");
    return result.data?.[0]?.count === 1 ? json({ status: "ready" }) : json({ status: "unavailable" }, 503);
  } catch { return json({ status: "unavailable" }, 503); }
}

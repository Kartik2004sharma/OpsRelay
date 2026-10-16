import { signIn, signOut } from "@/lib/auth";
import { failure, json, readJson } from "@/lib/http";

export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    if (body.kind === "logout") { await signOut(); return json({ signedOut: true }); }
    const secure = new URL(request.url).protocol === "https:" || request.headers.get("x-forwarded-proto") === "https";
    return json({ actor: await signIn(body.password, secure) });
  } catch (error) { return failure(error); }
}

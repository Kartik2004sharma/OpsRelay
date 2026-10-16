import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { database } from "./graph";
import { ApiError } from "./http";

const COOKIE = "opsrelay_session";
const SESSION_SECONDS = 8 * 60 * 60;
const digest = (value: string) => createHash("sha256").update(value).digest("hex");
const prefix = () => `opsrelay:${process.env.FALKORDB_GRAPH || "opsrelay"}`;

function operator() {
  const password = process.env.OPSRELAY_OPERATOR_PASSWORD;
  if (!password || password.length < 20) throw new ApiError(503, "Operator access has not been configured.");
  return { password, actor: process.env.OPSRELAY_OPERATOR_NAME || "Operations lead" };
}

const sessionKey = (token: string) => `${prefix()}:session:${createHmac("sha256", operator().password).update(token).digest("hex")}`;

export async function limit(key: string, count: number, seconds: number) {
  const connection = await (await database()).connection;
  const bucket = Math.floor(Date.now() / (seconds * 1000));
  const attempts = await connection.eval("local n = redis.call('INCR', KEYS[1]); if n == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end; return n", {
    keys: [`${prefix()}:limit:${digest(key)}:${bucket}`], arguments: [String(seconds + 1)],
  });
  if (Number(attempts) > count) throw new ApiError(429, "Too many requests. Please wait before trying again.");
}

export async function signIn(password: unknown, secure: boolean) {
  const config = operator();
  await limit("login", 30, 900);
  if (typeof password !== "string" || !timingSafeEqual(Buffer.from(digest(password), "hex"), Buffer.from(digest(config.password), "hex"))) {
    throw new ApiError(401, "The operator password is incorrect.");
  }
  const token = randomBytes(32).toString("hex");
  const connection = await (await database()).connection;
  await connection.set(sessionKey(token), config.actor, { EX: SESSION_SECONDS });
  (await cookies()).set(COOKIE, token, { httpOnly: true, secure, sameSite: "strict", path: "/", maxAge: SESSION_SECONDS });
  return config.actor;
}

export async function requireOperator() {
  operator();
  const token = (await cookies()).get(COOKIE)?.value || "";
  if (!/^[a-f0-9]{64}$/.test(token)) throw new ApiError(401, "Sign in to access the company workspace.");
  const connection = await (await database()).connection;
  const actor = await connection.get(sessionKey(token));
  if (!actor) throw new ApiError(401, "Your session expired. Please sign in again.");
  await limit(token, 120, 60);
  return actor;
}

export async function signOut() {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (token && /^[a-f0-9]{64}$/.test(token)) {
    const connection = await (await database()).connection;
    await connection.del(sessionKey(token));
  }
  store.delete(COOKIE);
}

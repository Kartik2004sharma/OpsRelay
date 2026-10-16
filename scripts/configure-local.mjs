import { randomBytes } from "node:crypto";
import { writeFile } from "node:fs/promises";

try {
  await writeFile(".env.local", `FALKORDB_URL=falkor://127.0.0.1:6379\nFALKORDB_GRAPH=opsrelay\nOPSRELAY_OPERATOR_NAME=Operations lead\nOPSRELAY_OPERATOR_PASSWORD=${randomBytes(24).toString("base64url")}\n`, { mode: 0o600, flag: "wx" });
  console.log("Created private .env.local. Open it locally to retrieve the operator password or configure FalkorDB Cloud.");
} catch (error) {
  if (error.code !== "EEXIST") throw error;
  console.log("Kept existing .env.local unchanged.");
}

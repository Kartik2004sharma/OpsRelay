import type { Metadata } from "next";
import Workspace from "./Workspace";

export const metadata: Metadata = { title: "Workspace — OpsRelay", robots: { index: false, follow: false } };

export default function WorkspacePage() { return <Workspace />; }

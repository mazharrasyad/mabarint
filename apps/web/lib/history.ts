import { createHash, randomUUID } from "node:crypto";
import { appendFile, mkdir, readFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { AnnotationResult, Profile } from "@mabarint/types";

// Every playground run is appended to one JSON-lines file on the server
// (a Docker volume in production), so runs survive restarts and redeploys.
const FILE = process.env.HISTORY_FILE ?? ".cache/history.jsonl";
const SALT = process.env.HISTORY_SALT ?? "mabarint";

export interface HistoryEntry {
  id: string;
  /** ISO timestamp (UTC) of the click. */
  time: string;
  /** Random id kept in the visitor's browser; lets them list their own runs. */
  clientId: string;
  /** Salted hash of the IP, for spotting abuse without storing the address. */
  ipHash: string;
  text: string;
  status: "ok" | "refused" | "error";
  /** Error code when status is "error" (rate_limited, timeout, ...). */
  error?: string;
  profile?: Profile;
  detectReason?: string;
  marks?: number;
  ms?: number;
  result?: AnnotationResult;
}

export type HistoryInput = Omit<HistoryEntry, "id" | "time" | "ipHash"> & { ip: string };

const CLIENT_ID = /^[A-Za-z0-9-]{8,64}$/;

export function validClientId(v: unknown): string | null {
  return typeof v === "string" && CLIENT_ID.test(v) ? v : null;
}

/** Appends one run. Never throws: losing a log line must not fail the request. */
export async function record(input: HistoryInput): Promise<void> {
  const { ip, ...rest } = input;
  const entry: HistoryEntry = {
    id: randomUUID(),
    time: new Date().toISOString(),
    ipHash: createHash("sha256").update(SALT + ip).digest("hex").slice(0, 16),
    ...rest,
  };
  try {
    await mkdir(dirname(FILE), { recursive: true });
    await appendFile(FILE, JSON.stringify(entry) + "\n");
  } catch (e) {
    console.error("[history] could not save run:", (e as Error).message);
  }
}

export type PublicEntry = Omit<HistoryEntry, "ipHash" | "clientId"> & { mine: boolean };

/**
 * The latest runs from every visitor, newest first. The IP hash and browser id
 * never leave the server; `mine` marks the caller's own runs.
 */
export async function listAll(clientId: string | null, limit = 50): Promise<{ entries: PublicEntry[]; total: number }> {
  let raw = "";
  try {
    raw = await readFile(FILE, "utf8");
  } catch {
    return { entries: [], total: 0 };
  }
  const lines = raw.split("\n").filter(Boolean);
  const entries: PublicEntry[] = [];
  for (let i = lines.length - 1; i >= 0 && entries.length < limit; i--) {
    try {
      const { ipHash: _ip, clientId: owner, ...entry } = JSON.parse(lines[i]) as HistoryEntry;
      entries.push({ ...entry, mine: clientId !== null && owner === clientId });
    } catch {
      // Skip a partially written line.
    }
  }
  return { entries, total: lines.length };
}

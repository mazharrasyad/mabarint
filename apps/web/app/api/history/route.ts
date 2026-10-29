import { listFor, validClientId } from "@/lib/history";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** The calling browser's own playground runs, newest first. */
export async function GET(req: Request) {
  const clientId = validClientId(new URL(req.url).searchParams.get("client"));
  if (!clientId) return Response.json({ entries: [] });
  return Response.json({ entries: await listFor(clientId) }, { headers: { "Cache-Control": "no-store" } });
}

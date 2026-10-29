import { listAll, validClientId } from "@/lib/history";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Every playground run, newest first. `client` only marks which runs are the caller's own. */
export async function GET(req: Request) {
  const clientId = validClientId(new URL(req.url).searchParams.get("client"));
  return Response.json(await listAll(clientId), { headers: { "Cache-Control": "no-store" } });
}

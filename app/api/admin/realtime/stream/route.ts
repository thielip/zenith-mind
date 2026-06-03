import { getRealtimeBuffer } from "@/server/realtime/event-hub";
import { gateAdminOnly } from "@/lib/auth/resolve-admin-action";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const gate = await gateAdminOnly();
  if (!gate.ok) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      let lastLen = 0;

      const push = () => {
        const buf = getRealtimeBuffer();
        const slice = buf.slice(lastLen);
        lastLen = buf.length;
        for (const event of slice) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
          );
        }
      };

      push();
      const interval = setInterval(push, 2000);

      request.signal.addEventListener("abort", () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

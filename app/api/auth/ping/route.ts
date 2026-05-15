import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getRemainingSeconds, verifyAccessToken } from "@/lib/auth/jwt";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  const jar = await cookies();
  const token = jar.get("access_token")?.value;

  if (!token) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  try {
    const payload = await verifyAccessToken(token);
    return NextResponse.json({
      authenticated: true,
      remainingSeconds: getRemainingSeconds(payload),
    });
  } catch {
    const response = NextResponse.json({ authenticated: false }, { status: 401 });
    response.cookies.delete("access_token");
    return response;
  }
}

import { NextResponse } from "next/server";
import crypto from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;

  if (!privateKey) {
    return NextResponse.json(
      { error: "Upload authentication is unavailable." },
      { status: 500 }
    );
  }

  try {
    const token = crypto.randomUUID();
    const expire = Math.floor(Date.now() / 1000) + 60 * 30; // 30 mins
    const signature = crypto
      .createHmac("sha1", privateKey)
      .update(token + expire)
      .digest("hex");

    return NextResponse.json({
      token,
      expire,
      signature,
    });
  } catch (err) {
    console.error("ImageKit Auth Error:", err);
    return NextResponse.json(
      { error: "Failed to generate authentication signature" },
      { status: 500 }
    );
  }
}

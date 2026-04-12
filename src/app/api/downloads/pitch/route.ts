/**
 * src/app/api/downloads/pitch/route.ts
 *
 * Serves NexPlan-CIO-Pitch.pptx securely.
 * Only accessible to authenticated info@nexplan.io users.
 * The file is stored at: public/downloads/NexPlan-CIO-Pitch.pptx
 */

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

const ADMIN_EMAIL = "info@nexplan.io";

export async function GET() {
  // Auth check
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }
  if (user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const filePath = path.join(process.cwd(), "public", "downloads", "NexPlan-CIO-Pitch.pptx");
    const fileBuffer = await readFile(filePath);

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": 'attachment; filename="NexPlan-CIO-Pitch.pptx"',
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex",
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}

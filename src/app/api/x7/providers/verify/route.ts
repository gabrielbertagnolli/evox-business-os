import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { url, key } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    if (key) {
      headers["Authorization"] = `Bearer ${key}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15-second timeout

    const cleanUrl = url.replace(/\/$/, "");
    const res = await fetch(`${cleanUrl}/models`, {
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errorText = await res.text().catch(() => "");
      return NextResponse.json({ 
        error: `Failed to connect. Status: ${res.status}. Response: ${errorText.substring(0, 200)}` 
      }, { status: 400 });
    }

    const data = await res.json();
    const models = Array.isArray(data) ? data : (data.data || []);

    return NextResponse.json({ 
      success: true, 
      modelsCount: models.length,
      models: models.map((m: any) => m.id || m.name)
    });
  } catch (err: any) {
    return NextResponse.json({ 
      error: `Error de conexión: ${err.message || "No se pudo conectar al endpoint"}` 
    }, { status: 500 });
  }
}

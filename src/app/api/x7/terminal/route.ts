import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code, language } = await req.json();

    if (!code || !language) {
      return NextResponse.json({ error: "Missing code or language" }, { status: 400 });
    }

    // Piston Language Mapping
    const langMap: Record<string, string> = { 
      "python": "python", 
      "javascript": "node", 
      "js": "node",
      "bash": "bash" 
    };
    
    const versionMap: Record<string, string> = { 
      "python": "3.10.0", 
      "javascript": "18.15.0", 
      "js": "18.15.0",
      "bash": "5.2.0" 
    };
    
    const runtime = langMap[language] || "python";
    const version = versionMap[language] || "3.10.0";
    
    const response = await fetch("https://emkc.org/api/v2/piston/execute", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        language: runtime,
        version: version,
        files: [
          {
            name: "main",
            content: code
          }
        ],
        compile_timeout: 10000,
        run_timeout: 3000,
        compile_memory_limit: -1,
        run_memory_limit: -1
      })
    });
    
    const data = await response.json();
    
    if (data.message) {
      return NextResponse.json({ error: "Error de la API Piston: " + data.message }, { status: 500 });
    }
    
    let output = "";
    if (data.compile && data.compile.output) output += "Compile Output:\n" + data.compile.output + "\n";
    if (data.run && data.run.output) output += data.run.output;
    
    return NextResponse.json({ 
      output: output || "(Sin salida)",
      status: data.run?.code === 0 ? "success" : "error"
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/dist/server/web/spec-extension/request";
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

    if (language === "javascript" || language === "js") {
      try {
        const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
        const fn = new AsyncFunction(code);
        const result = await fn();
        return NextResponse.json({ 
          output: result !== undefined ? String(result) : "Execution completed with no return value.",
          status: "success"
        });
      } catch (err: any) {
        return NextResponse.json({ 
          output: `Error: ${err.message}`,
          status: "error"
        });
      }
    } else if (language === "python" || language === "py") {
      // E2B or Python sandbox placeholder
      if (process.env.E2B_API_KEY) {
        return NextResponse.json({ 
          output: "[E2B SDK Required] Please install @e2b/code-interpreter to execute Python in production.",
          status: "warning"
        });
      } else {
        return NextResponse.json({ 
          output: `[Sandbox] Python execution requires E2B_API_KEY. \nCode intercepted: \n${code.substring(0, 50)}...`,
          status: "warning"
        });
      }
    }

    return NextResponse.json({ error: "Unsupported language" }, { status: 400 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

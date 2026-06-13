import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { executeSkill } from "@/lib/x7/tools";

/**
 * X7 Autonomous Cron Scheduler
 * Adaptación de `cron/scheduler.py` de Hermes.
 * Este endpoint está pensado para ser invocado periódicamente (ej: Vercel Cron).
 */
export async function GET(request: Request) {
  // Asegurar que esta ruta solo es llamada de manera segura (ej: por Vercel Cron o token)
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();
  const startTime = Date.now();
  let executedCount = 0;

  try {
    // 1. Obtener todos los agentes activos
    const { data: agents } = await supabase
      .from("agents")
      .select("*")
      .eq("status", "active");

    if (agents && agents.length > 0) {
      for (const agent of agents) {
        // 2. Por cada agente, buscar si tiene "Skills" de cron o tareas pendientes.
        // Por simplicidad en la migración de Hermes, buscamos skills que contengan la palabra "cron" o "scheduler".
        const { data: skills } = await supabase
          .from("x7_skills")
          .select("*")
          .eq("user_id", agent.user_id)
          .eq("is_active", true)
          .ilike("name", "%cron%");

        if (skills && skills.length > 0) {
          for (const skill of skills) {
            try {
              // Ejecutar la skill en modo background
              const result = await executeSkill(skill, { context: "cron_trigger", agentId: agent.id });
              
              // Registrar el resultado en la memoria a largo plazo si produjo algo interesante
              if (result && result.length > 5 && result !== "{}") {
                await supabase.from("x7_memory_nodes").insert({
                  user_id: agent.user_id,
                  content: `[Cron: ${skill.name}] ${result.substring(0, 500)}`,
                  type: "cron_observation"
                });
              }
              executedCount++;
            } catch (err) {
              console.error(`Cron error for skill ${skill.name}:`, err);
            }
          }
        }
      }
    }

    return NextResponse.json({
      status: "success",
      executed_jobs: executedCount,
      duration_ms: Date.now() - startTime
    });
  } catch (error: any) {
    console.error("X7 Cron Scheduler Failed:", error);
    return NextResponse.json({ status: "error", message: error.message }, { status: 500 });
  }
}

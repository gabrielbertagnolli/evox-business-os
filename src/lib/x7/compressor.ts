import { createClient } from "@/lib/supabase/server";

export interface X7Message {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Adaptación de `trajectory_compressor.py` de Hermes.
 * Si el historial supera un límite, usa un LLM ligero para extraer un "hecho" o "regla".
 */
export async function compressTrajectory(
  userId: string,
  messages: X7Message[]
): Promise<boolean> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || messages.length < 10) return false;

  const conversationText = messages
    .filter((m) => m.role !== "system")
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n");

  // Si la conversación es muy corta a pesar de tener mensajes, no comprimir
  if (conversationText.length < 2000) return false;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // Modelo rápido para compresión
        messages: [
          {
            role: "system",
            content:
              "Eres el subsistema de compresión de X7. Extrae un hecho (fact) o regla (rule) crucial sobre el negocio del usuario, sus preferencias, o integraciones basándote en la siguiente conversación. Debe ser un string corto. Si no hay nada útil, responde exactamente 'NULL'.",
          },
          {
            role: "user",
            content: conversationText,
          },
        ],
      }),
    });

    const body = await response.json();
    const extractedMemory = body.choices?.[0]?.message?.content?.trim();

    if (extractedMemory && extractedMemory !== "NULL" && extractedMemory.length > 5) {
      // Guardar en la base de datos
      const supabase = await createClient();
      await supabase.from("x7_memory_nodes").insert({
        user_id: userId,
        content: extractedMemory,
        type: "fact",
      });
      return true;
    }
  } catch (error) {
    console.error("Error compressing trajectory:", error);
  }

  return false;
}

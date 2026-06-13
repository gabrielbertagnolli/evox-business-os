import type { X7SkillSource } from "./context";

export interface X7ToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: any; // JSON Schema
  };
}

/**
 * Convierte las habilidades almacenadas en la base de datos a definiciones de herramientas (Function Calling)
 */
export function formatSkillsAsTools(skills: X7SkillSource[]): X7ToolDefinition[] {
  return skills.map((skill) => {
    // Por simplicidad, asumimos que `codePayload` contiene la firma JSON Schema de los parámetros
    // En un sistema real, extraeríamos esto de la definición de la skill.
    let parameters = {
      type: "object",
      properties: {
        input: {
          type: "string",
          description: "Entrada dinámica para la habilidad",
        },
      },
    };

    try {
      // Si el usuario guardó un JSON structurado con { schema, code } 
      const parsed = JSON.parse(skill.codePayload || "{}");
      if (parsed.parameters) {
        parameters = parsed.parameters;
      }
    } catch (e) {
      // Usar parámetros por defecto
    }

    return {
      type: "function",
      function: {
        name: `skill_${skill.id.replace(/-/g, "_")}`,
        description: skill.description || "Habilidad personalizada de X7",
        parameters,
      },
    };
  });
}

/**
 * Ejecuta una habilidad dinámicamente usando la API segura de Piston (Sandbox aislada).
 */
export async function executeSkill(skill: X7SkillSource, args: any): Promise<string> {
  try {
    let script = skill.codePayload || "";
    
    // Si era JSON struct { schema, code }
    try {
      const parsed = JSON.parse(script);
      if (parsed.code) script = parsed.code;
    } catch (e) {}

    // Inyectar argumentos en el script de manera segura para el runtime
    const injectedCode = `
      const args = ${JSON.stringify(args)};
      async function main() {
        ${script}
      }
      main().then(res => console.log(JSON.stringify(res))).catch(err => console.error(err));
    `;

    // Ejecución segura en sandbox remoto (Piston API)
    const response = await fetch("https://emkc.org/api/v2/piston/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language: "node",
        version: "18.15.0",
        files: [{ name: "main.js", content: injectedCode }],
        compile_timeout: 10000,
        run_timeout: 3000
      })
    });

    const data = await response.json();
    if (data.message) throw new Error(data.message);

    let output = "";
    if (data.run && data.run.output) output = data.run.output.trim();
    
    return output || "Ejecución completada sin salida.";
  } catch (error: any) {
    console.error(`Skill execution failed (${skill.name}):`, error);
    return `Error ejecutando la habilidad en el sandbox: ${error.message}`;
  }
}

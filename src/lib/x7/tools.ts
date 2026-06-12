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
 * Ejecuta una habilidad dinámicamente usando `Function` de JS de forma segura (limitada).
 * Nota: En un entorno Serverless Edge completo, evaluar JS arbitrario es peligroso.
 * Aquí lo simplificamos envolviendo la función.
 */
export async function executeSkill(skill: X7SkillSource, args: any): Promise<string> {
  try {
    let script = skill.codePayload || "";
    
    // Si era JSON struct { schema, code }
    try {
      const parsed = JSON.parse(script);
      if (parsed.code) script = parsed.code;
    } catch (e) {}

    // Evaluar la función en un wrapper (Nota de arquitectura: esto requiere Node.js runtime, no Edge)
    const runSkill = new Function("args", `
      return (async function() {
        ${script}
      })();
    `);

    const result = await runSkill(args);
    return JSON.stringify(result);
  } catch (error: any) {
    console.error(`Skill execution failed (${skill.name}):`, error);
    return `Error ejecutando la habilidad: ${error.message}`;
  }
}

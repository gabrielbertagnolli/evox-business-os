-- Create Open Terminal (Execute Code) tool
INSERT INTO public.x7_tools (id, user_id, name, description, schema, code, is_active)
VALUES (
    uuid_generate_v4(),
    NULL,
    'execute_code',
    'Ejecuta código fuente (Python, Javascript, Bash) en un entorno seguro (Sandbox) y devuelve el resultado.',
    '{
        "type": "object",
        "properties": {
            "language": {
                "type": "string",
                "enum": ["python", "javascript", "bash"],
                "description": "El lenguaje de programación a utilizar."
            },
            "code": {
                "type": "string",
                "description": "El código fuente a ejecutar."
            }
        },
        "required": ["language", "code"]
    }'::jsonb,
    'try {
        const langMap = { "python": "python", "javascript": "node", "bash": "bash" };
        const versionMap = { "python": "3.10.0", "javascript": "18.15.0", "bash": "5.2.0" };
        
        const runtime = langMap[args.language] || "python";
        const version = versionMap[args.language] || "3.10.0";
        
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
                        content: args.code
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
            return "Error de la API Piston: " + data.message;
        }
        
        let output = "";
        if (data.compile && data.compile.output) output += "Compile Output:\n" + data.compile.output + "\n";
        if (data.run && data.run.output) output += data.run.output;
        
        return "=== TERMINAL OUTPUT ===\n" + (output || "(Sin salida)") + "\n=====================";
    } catch (e) {
        return "Error interno ejecutando código: " + e.message;
    }',
    true
);

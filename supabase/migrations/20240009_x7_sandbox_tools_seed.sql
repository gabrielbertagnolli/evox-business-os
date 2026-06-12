-- Seed Sandbox tools (Parity with Open-WebUI / E2B)

DO $BODY$
DECLARE
    user_rec RECORD;
BEGIN
    FOR user_rec IN SELECT id FROM auth.users LOOP
        
        -- 1. Run Javascript (Node.js Sandbox)
        INSERT INTO public.x7_skills (user_id, name, description, code_payload, is_active)
        VALUES (
            user_rec.id,
            'run_javascript',
            'Ejecuta código Javascript (Node.js) de forma segura y devuelve el resultado. Útil para cálculos matemáticos, algoritmos, o formateo de datos.',
            '{
  "parameters": {
    "type": "object",
    "properties": {
      "code": { "type": "string", "description": "Código Javascript a ejecutar. Debe usar return para devolver el valor final." }
    },
    "required": ["code"]
  },
  "code": "try { const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor; const fn = new AsyncFunction(args.code); const result = await fn(); return result !== undefined ? String(result) : ''Ejecutado sin retorno''; } catch (e) { return `Error ejecutando Javascript: ${e.message}`; }"
}',
            true
        ) ON CONFLICT DO NOTHING;

        -- 2. Run Python (E2B Sandbox Placeholder)
        INSERT INTO public.x7_skills (user_id, name, description, code_payload, is_active)
        VALUES (
            user_rec.id,
            'run_python',
            'Ejecuta código Python en un Sandbox de E2B. Útil para data science, pandas, matplotlib y análisis avanzado.',
            '{
  "parameters": {
    "type": "object",
    "properties": {
      "code": { "type": "string", "description": "Código Python a ejecutar." }
    },
    "required": ["code"]
  },
  "code": "return `[Simulado] Python Sandbox no está habilitado. Para ejecutar código Python avanzado (${args.code.substring(0, 20)}...) de manera segura, configura tu E2B_API_KEY en las variables de entorno del servidor.`;"
}',
            true
        ) ON CONFLICT DO NOTHING;

    END LOOP;
END;
$BODY$;

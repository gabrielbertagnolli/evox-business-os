-- Seed default tools for X7 (Hermes Core Tools)

-- Nota: Como esto debe aplicarse a todos los usuarios, en un entorno real insertaríamos
-- esto mediante un trigger al crear el usuario. Por simplicidad, aquí lo insertamos 
-- para el primer usuario existente o usando un bloque DO para todos los usuarios.

DO $$
DECLARE
    user_rec RECORD;
BEGIN
    FOR user_rec IN SELECT id FROM auth.users LOOP
        
        -- 1. Web Search Tool (Simulación simple usando un endpoint abierto o fetch)
        INSERT INTO public.x7_skills (user_id, name, description, code_payload, is_active)
        VALUES (
            user_rec.id,
            'web_search',
            'Realiza una búsqueda en la web para obtener información actualizada en tiempo real.',
            '{
  "parameters": {
    "type": "object",
    "properties": {
      "query": { "type": "string", "description": "Lo que deseas buscar en internet" }
    },
    "required": ["query"]
  },
  "code": "try { const response = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(args.query)}&format=json`); const data = await response.json(); return data.AbstractText || ''Sin resultados directos. Intenta reformular.''; } catch (e) { return ''Error buscando en internet''; }"
}',
            true
        ) ON CONFLICT DO NOTHING;

        -- 2. Calculator Tool
        INSERT INTO public.x7_skills (user_id, name, description, code_payload, is_active)
        VALUES (
            user_rec.id,
            'calculator',
            'Calculadora matemática para realizar operaciones numéricas exactas.',
            '{
  "parameters": {
    "type": "object",
    "properties": {
      "expression": { "type": "string", "description": "Expresión matemática a evaluar (ej: 25 * 4 + 10)" }
    },
    "required": ["expression"]
  },
  "code": "try { return String(eval(args.expression)); } catch (e) { return ''Error matemático''; }"
}',
            true
        ) ON CONFLICT DO NOTHING;

        -- 3. System Status / Date
        INSERT INTO public.x7_skills (user_id, name, description, code_payload, is_active)
        VALUES (
            user_rec.id,
            'get_system_time',
            'Obtiene la fecha y hora actual del sistema.',
            '{
  "parameters": {
    "type": "object",
    "properties": {}
  },
  "code": "return new Date().toISOString();"
}',
            true
        ) ON CONFLICT DO NOTHING;

    END LOOP;
END;
$$;

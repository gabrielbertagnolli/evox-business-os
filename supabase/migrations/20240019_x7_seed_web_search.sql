-- Seed Web Search Tool using Jina Search API

DO $BODY$
DECLARE
    user_rec RECORD;
BEGIN
    FOR user_rec IN SELECT id FROM auth.users LOOP
        
        -- Web Search (Jina Search API)
        INSERT INTO public.x7_skills (user_id, name, description, code_payload, is_active)
        VALUES (
            user_rec.id,
            'web_search',
            'Busca informacion actualizada en internet usando un motor de busqueda. Devuelve un resumen en Markdown de los resultados mas relevantes.',
            '{
  "parameters": {
    "type": "object",
    "properties": {
      "query": { "type": "string", "description": "La consulta o pregunta a buscar en internet" }
    },
    "required": ["query"]
  },
  "code": "try { const response = await fetch(`https://s.jina.ai/${encodeURIComponent(args.query)}`); const text = await response.text(); return text.substring(0, 10000); } catch (e) { return ''Error en la búsqueda web: '' + e.message; }"
}',
            true
        ) ON CONFLICT DO NOTHING;

    END LOOP;
END;
$BODY$;

-- Seed massive cloud-safe tools (Parity with Hermes capabilities)

DO $BODY$
DECLARE
    user_rec RECORD;
BEGIN
    FOR user_rec IN SELECT id FROM auth.users LOOP
        
        -- 1. Read URL (Scrapping seguro con Jina Reader)
        INSERT INTO public.x7_skills (user_id, name, description, code_payload, is_active)
        VALUES (
            user_rec.id,
            'read_url',
            'Lee el contenido de cualquier página web y lo convierte a texto limpio (Markdown). Útil para investigar enlaces provistos.',
            '{
  "parameters": {
    "type": "object",
    "properties": {
      "url": { "type": "string", "description": "La URL completa a leer (incluyendo https://)" }
    },
    "required": ["url"]
  },
  "code": "try { const response = await fetch(`https://r.jina.ai/${args.url}`); const text = await response.text(); return text.substring(0, 10000); } catch (e) { return ''Error leyendo URL''; }"
}',
            true
        ) ON CONFLICT DO NOTHING;

        -- 2. Fetch Github Repo Data
        INSERT INTO public.x7_skills (user_id, name, description, code_payload, is_active)
        VALUES (
            user_rec.id,
            'github_get_repo_info',
            'Obtiene información general y el archivo README de un repositorio público en GitHub.',
            '{
  "parameters": {
    "type": "object",
    "properties": {
      "owner": { "type": "string", "description": "Dueño del repositorio (ej: facebook)" },
      "repo": { "type": "string", "description": "Nombre del repositorio (ej: react)" }
    },
    "required": ["owner", "repo"]
  },
  "code": "try { const res = await fetch(`https://api.github.com/repos/${args.owner}/${args.repo}`); const data = await res.json(); return `Descripción: ${data.description}. Estrellas: ${data.stargazers_count}`; } catch (e) { return ''Error consultando GitHub''; }"
}',
            true
        ) ON CONFLICT DO NOTHING;

        -- 3. DALL-E Image Generation (Requiere OpenAI Key en entorno)
        INSERT INTO public.x7_skills (user_id, name, description, code_payload, is_active)
        VALUES (
            user_rec.id,
            'generate_image',
            'Genera una imagen usando OpenAI DALL-E basada en un prompt descriptivo.',
            '{
  "parameters": {
    "type": "object",
    "properties": {
      "prompt": { "type": "string", "description": "Descripción detallada de la imagen a generar" }
    },
    "required": ["prompt"]
  },
  "code": "try { const res = await fetch(''https://api.openai.com/v1/images/generations'', { method: ''POST'', headers: { ''Authorization'': `Bearer ${process.env.OPENAI_API_KEY}`, ''Content-Type'': ''application/json'' }, body: JSON.stringify({ prompt: args.prompt, n: 1, size: ''1024x1024'' }) }); const data = await res.json(); return data.data[0].url; } catch (e) { return ''Error generando imagen. Verifica tu API Key.''; }"
}',
            true
        ) ON CONFLICT DO NOTHING;

        -- 4. Get Crypto Prices (CoinGecko)
        INSERT INTO public.x7_skills (user_id, name, description, code_payload, is_active)
        VALUES (
            user_rec.id,
            'get_crypto_price',
            'Obtiene el precio actual en USD de una criptomoneda usando CoinGecko.',
            '{
  "parameters": {
    "type": "object",
    "properties": {
      "coin_id": { "type": "string", "description": "ID de la moneda en coingecko (ej: bitcoin, ethereum)" }
    },
    "required": ["coin_id"]
  },
  "code": "try { const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${args.coin_id}&vs_currencies=usd`); const data = await res.json(); return `El precio de ${args.coin_id} es $\` + data[args.coin_id].usd; } catch (e) { return ''Error consultando precio.''; }"
}',
            true
        ) ON CONFLICT DO NOTHING;

        -- 5. Linear Issue Placeholder
        INSERT INTO public.x7_skills (user_id, name, description, code_payload, is_active)
        VALUES (
            user_rec.id,
            'linear_create_issue',
            'Crea un ticket/tarea en Linear (Requiere API Key configurada internamente).',
            '{
  "parameters": {
    "type": "object",
    "properties": {
      "title": { "type": "string", "description": "Título de la tarea" },
      "description": { "type": "string", "description": "Cuerpo de la tarea" }
    },
    "required": ["title"]
  },
  "code": "return `[Simulado] Tarea creada en Linear: ${args.title}. Por favor configura el token oficial de Linear en las integraciones para accionarlo.`;"
}',
            true
        ) ON CONFLICT DO NOTHING;

    END LOOP;
END;
$BODY$;

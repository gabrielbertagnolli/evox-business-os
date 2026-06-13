-- Create Generate Image tool
INSERT INTO public.x7_tools (id, user_id, name, description, schema, code, is_active)
VALUES (
    uuid_generate_v4(),
    NULL,
    'generate_image',
    'Genera una imagen a partir de una descripción de texto usando DALL-E 3.',
    '{
        "type": "object",
        "properties": {
            "prompt": {
                "type": "string",
                "description": "Una descripción muy detallada en inglés de la imagen que quieres generar."
            }
        },
        "required": ["prompt"]
    }'::jsonb,
    'try {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) return "Error: OPENAI_API_KEY no configurada.";
        
        const response = await fetch("https://api.openai.com/v1/images/generations", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "dall-e-3",
                prompt: args.prompt,
                n: 1,
                size: "1024x1024"
            })
        });
        
        const data = await response.json();
        if (data.error) return "Error de la API de DALL-E: " + data.error.message;
        
        const imageUrl = data.data[0].url;
        return `![Imagen Generada](${imageUrl})\n\nImagen generada con éxito basada en el prompt: "${args.prompt}"`;
    } catch (e) {
        return "Error interno generando la imagen: " + e.message;
    }',
    true
);

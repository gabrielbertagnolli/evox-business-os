import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function openApiToSchema(parameters: any[], requestBody: any) {
  const schema: any = { type: "object", properties: {}, required: [] };
  
  if (parameters) {
    for (const param of parameters) {
      if (param.schema) {
        schema.properties[param.name] = {
          type: param.schema.type || "string",
          description: param.description || `Parameter ${param.name}`
        };
        if (param.required) schema.required.push(param.name);
      }
    }
  }

  if (requestBody && requestBody.content && requestBody.content["application/json"]) {
    const bodySchema = requestBody.content["application/json"].schema;
    if (bodySchema.properties) {
      for (const [key, val] of Object.entries<any>(bodySchema.properties)) {
        schema.properties[key] = {
          type: val.type || "string",
          description: val.description || `Body param ${key}`
        };
        if (bodySchema.required?.includes(key)) schema.required.push(key);
      }
    }
  }

  return schema;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { openApiJson, baseUrl, integrationName } = await req.json();

    if (!openApiJson || !openApiJson.paths) {
      return NextResponse.json({ error: "Invalid OpenAPI Specification" }, { status: 400 });
    }

    const skillsToInsert = [];
    const serverUrl = baseUrl || (openApiJson.servers ? openApiJson.servers[0]?.url : "");

    for (const [path, methods] of Object.entries<any>(openApiJson.paths)) {
      for (const [method, operation] of Object.entries<any>(methods)) {
        if (!operation.operationId) continue; // Skip if no operation ID

        const skillName = `${integrationName ? integrationName.toLowerCase() + "_" : ""}${operation.operationId.replace(/[^a-zA-Z0-9_]/g, "_")}`;
        const schema = openApiToSchema(operation.parameters, operation.requestBody);
        
        const code = `
try {
  let endpoint = \`${serverUrl}${path}\`;
  
  // Replace path parameters
  ${operation.parameters?.filter((p: any) => p.in === "path").map((p: any) => `endpoint = endpoint.replace("{${p.name}}", args["${p.name}"]);`).join("\n  ") || ""}
  
  // Extract query params
  const queryParams = new URLSearchParams();
  ${operation.parameters?.filter((p: any) => p.in === "query").map((p: any) => `if (args["${p.name}"]) queryParams.append("${p.name}", args["${p.name}"]);`).join("\n  ") || ""}
  if ([...queryParams].length > 0) endpoint += "?" + queryParams.toString();

  const options = {
    method: "${method.toUpperCase()}",
    headers: {
      "Content-Type": "application/json",
      // "Authorization": "Bearer YOUR_TOKEN_HERE" // Agrega tu lógica de Auth aquí
    }
  };

  if ("${method.toUpperCase()}" !== "GET" && "${method.toUpperCase()}" !== "HEAD") {
    const bodyArgs = { ...args };
    // Remove path and query params from body
    ${operation.parameters?.map((p: any) => `delete bodyArgs["${p.name}"];`).join("\n    ") || ""}
    if (Object.keys(bodyArgs).length > 0) {
      options.body = JSON.stringify(bodyArgs);
    }
  }

  const response = await fetch(endpoint, options);
  const data = await response.json();
  return JSON.stringify(data);
} catch (error) {
  return "Error executing API call: " + error.message;
}`;

        skillsToInsert.push({
          user_id: user.id,
          name: skillName.substring(0, 50),
          description: operation.summary || operation.description || `Llama a la API ${method.toUpperCase()} ${path}`,
          code_payload: {
            parameters: schema,
            code: code.trim()
          },
          is_active: true
        });
      }
    }

    if (skillsToInsert.length === 0) {
      return NextResponse.json({ error: "No valid operations found to import." }, { status: 400 });
    }

    const { error } = await supabase.from("x7_skills").insert(skillsToInsert);
    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      imported: skillsToInsert.length,
      message: `Successfully imported ${skillsToInsert.length} skills from OpenAPI specs.` 
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

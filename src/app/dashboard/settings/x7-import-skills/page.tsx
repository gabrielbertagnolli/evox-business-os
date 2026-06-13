"use client";

import React, { useState } from "react";
import { Plug, Plus, Download, BookOpen } from "lucide-react";
import { toast } from "sonner";

export default function OpenAPIImportPage() {
  const [openApiUrl, setOpenApiUrl] = useState("");
  const [integrationName, setIntegrationName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleImport = async () => {
    if (!openApiUrl || !integrationName) {
      toast.error("Por favor completa todos los campos.");
      return;
    }

    setIsLoading(true);
    try {
      // Fetch the OpenAPI JSON from the provided URL
      const response = await fetch(openApiUrl);
      if (!response.ok) throw new Error("No se pudo descargar el archivo OpenAPI");
      const openApiJson = await response.json();

      const importRes = await fetch("/api/x7/skills/import-openapi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          openApiJson,
          integrationName: integrationName.toLowerCase().replace(/[^a-z0-9]/g, "_")
        })
      });

      const data = await importRes.json();
      if (!importRes.ok) throw new Error(data.error || "Error importando skills");

      toast.success(`Se importaron ${data.imported} herramientas exitosamente.`);
      setOpenApiUrl("");
      setIntegrationName("");
    } catch (err: any) {
      toast.error(err.message || "Error desconocido");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Plug className="w-6 h-6 text-blue-500" />
          Extensibilidad Universal (OpenAPI / MCP)
        </h1>
        <p className="text-gray-400 mt-2">
          Dale a X7 la capacidad de usar herramientas externas automáticamente importando especificaciones OpenAPI (Swagger) o conectando servidores MCP.
        </p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-green-500" />
          Importar desde OpenAPI
        </h2>
        <p className="text-sm text-gray-400">
          Convierte cualquier API REST (HubSpot, Stripe, Notion) en un conjunto de *Skills* nativas para X7. Solo provee el JSON de OpenAPI.
        </p>

        <div className="grid gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nombre de la Integración (Prefijo)</label>
            <input 
              type="text" 
              placeholder="ej. stripe"
              value={integrationName}
              onChange={(e) => setIntegrationName(e.target.value)}
              className="w-full bg-black border border-gray-800 rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">URL del JSON de OpenAPI</label>
            <input 
              type="url" 
              placeholder="https://api.example.com/openapi.json"
              value={openApiUrl}
              onChange={(e) => setOpenApiUrl(e.target.value)}
              className="w-full bg-black border border-gray-800 rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
          
          <button 
            onClick={handleImport}
            disabled={isLoading}
            className="mt-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? "Importando..." : <><Download className="w-4 h-4" /> Importar Skills</>}
          </button>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4 opacity-50 relative">
        <div className="absolute top-4 right-4 bg-gray-800 text-xs px-2 py-1 rounded">Próximamente</div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Plus className="w-5 h-5 text-purple-500" />
          Model Context Protocol (MCP) Servers
        </h2>
        <p className="text-sm text-gray-400">
          Conecta servidores MCP para expandir las capacidades de X7 con acceso directo a sistemas de archivos, bases de datos y más herramientas.
        </p>
        
        <button disabled className="mt-2 bg-gray-800 text-gray-400 font-medium py-2 px-4 rounded-lg cursor-not-allowed">
          Agregar MCP Server
        </button>
      </div>
    </div>
  );
}

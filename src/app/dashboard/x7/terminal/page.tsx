"use client";

import React, { useState, useRef, useEffect } from "react";
import { Terminal as TerminalIcon, Play, Code2, Cpu } from "lucide-react";
import { toast } from "sonner";

export default function TerminalPage() {
  const [history, setHistory] = useState<{ type: "input" | "output" | "error" | "system", text: string }[]>([
    { type: "system", text: "Evox OS Terminal Sandbox v1.0.0" },
    { type: "system", text: "Conectado al motor de ejecución aislado de X7." },
    { type: "system", text: "Escribe código Javascript y presiona Ctrl+Enter para evaluar." },
  ]);
  const [input, setInput] = useState("");
  const [language, setLanguage] = useState<"javascript" | "python">("javascript");
  const [isExecuting, setIsExecuting] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  const handleExecute = async () => {
    if (!input.trim()) return;

    setHistory((prev) => [...prev, { type: "input", text: `[${language}] ${input}` }]);
    setIsExecuting(true);
    
    try {
      const res = await fetch("/api/x7/terminal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: input, language })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setHistory((prev) => [...prev, { type: "error", text: data.error || "Execution failed" }]);
      } else {
        setHistory((prev) => [...prev, { 
          type: data.status === "error" ? "error" : "output", 
          text: data.output 
        }]);
      }
    } catch (err: any) {
      setHistory((prev) => [...prev, { type: "error", text: `Network Error: ${err.message}` }]);
    } finally {
      setIsExecuting(false);
      setInput("");
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] p-6 bg-black text-green-400 font-mono">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-5 h-5 text-gray-400" />
          <h1 className="text-lg font-semibold text-gray-200">X7 Open Terminal</h1>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={() => setLanguage("javascript")}
            className={`px-3 py-1 text-xs rounded-md flex items-center gap-1 transition-colors ${language === "javascript" ? "bg-yellow-500/20 text-yellow-500" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}
          >
            <Code2 className="w-3 h-3" /> JS
          </button>
          <button 
            onClick={() => setLanguage("python")}
            className={`px-3 py-1 text-xs rounded-md flex items-center gap-1 transition-colors ${language === "python" ? "bg-blue-500/20 text-blue-500" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}
          >
            <Cpu className="w-3 h-3" /> Python
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto mb-4 space-y-2 text-sm pr-2 scrollbar-thin scrollbar-thumb-gray-800">
        {history.map((log, i) => (
          <div key={i} className="whitespace-pre-wrap break-all">
            {log.type === "system" && <span className="text-blue-400">--- {log.text}</span>}
            {log.type === "input" && <span className="text-gray-300">❯ {log.text}</span>}
            {log.type === "output" && <span className="text-green-400">{log.text}</span>}
            {log.type === "error" && <span className="text-red-500">{log.text}</span>}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="relative border border-gray-800 rounded-lg bg-gray-900/50 p-2 focus-within:border-green-500/50 transition-colors">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              handleExecute();
            }
          }}
          placeholder={`// Escribe tu código en ${language}...\n// Presiona Ctrl + Enter para ejecutar (usa console.log o print para ver la salida)`}
          className="w-full h-32 bg-transparent text-gray-200 outline-none resize-none font-mono text-sm placeholder:text-gray-600"
          spellCheck={false}
        />
        <button
          onClick={handleExecute}
          disabled={isExecuting || !input.trim()}
          className="absolute bottom-3 right-3 p-2 bg-green-500/20 text-green-500 hover:bg-green-500/30 rounded-md disabled:opacity-50 transition-colors flex items-center gap-2 text-sm font-semibold"
        >
          {isExecuting ? "Ejecutando..." : "Run"} <Play className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

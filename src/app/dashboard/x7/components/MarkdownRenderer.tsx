import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({ node, inline, className, children, ...props }: any) {
          const match = /language-(\w+)/.exec(className || "");
          return !inline && match ? (
            <div className="relative mt-2 mb-4 rounded-md overflow-hidden text-sm border border-white/10">
              <div className="flex items-center justify-between px-4 py-1.5 bg-[#1a1b20] border-b border-white/5">
                <span className="text-xs font-mono text-white/50 lowercase">{match[1]}</span>
                <button 
                  onClick={() => navigator.clipboard.writeText(String(children).replace(/\n$/, ""))}
                  className="text-xs text-white/40 hover:text-white transition-colors"
                >
                  Copiar
                </button>
              </div>
              <SyntaxHighlighter
                {...props}
                style={vscDarkPlus as any}
                language={match[1]}
                PreTag="div"
                customStyle={{ margin: 0, background: "#0a0b0e", padding: "1rem" }}
              >
                {String(children).replace(/\n$/, "")}
              </SyntaxHighlighter>
            </div>
          ) : (
            <code {...props} className="bg-white/10 px-1.5 py-0.5 rounded-md text-[#2d7bff] font-mono text-[0.9em]">
              {children}
            </code>
          );
        },
        p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
        ul: ({ children }) => <ul className="list-disc pl-5 mb-3 space-y-1">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 space-y-1">{children}</ol>,
        li: ({ children }) => <li className="pl-1">{children}</li>,
        h1: ({ children }) => <h1 className="text-2xl font-bold mb-4 mt-6 text-white">{children}</h1>,
        h2: ({ children }) => <h2 className="text-xl font-bold mb-3 mt-5 text-white">{children}</h2>,
        h3: ({ children }) => <h3 className="text-lg font-bold mb-3 mt-4 text-white">{children}</h3>,
        a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-[#2d7bff] hover:underline">{children}</a>,
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-[#2d7bff]/50 pl-4 py-1 my-3 text-white/70 italic bg-white/5 rounded-r-lg">
            {children}
          </blockquote>
        ),
        table: ({ children }) => (
          <div className="overflow-x-auto mb-4 border border-white/10 rounded-lg">
            <table className="w-full text-sm text-left">{children}</table>
          </div>
        ),
        thead: ({ children }) => <thead className="bg-white/5 text-xs uppercase text-white/70">{children}</thead>,
        th: ({ children }) => <th className="px-4 py-3 border-b border-white/10 font-medium">{children}</th>,
        td: ({ children }) => <td className="px-4 py-3 border-b border-white/5">{children}</td>,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

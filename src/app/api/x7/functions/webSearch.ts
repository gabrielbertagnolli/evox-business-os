export async function performWebSearch(query: string, firecrawlKey?: string): Promise<string> {
  if (firecrawlKey) {
    try {
      const res = await fetch("https://api.firecrawl.dev/v1/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${firecrawlKey}`
        },
        body: JSON.stringify({ query, limit: 5 })
      });
      const data = await res.json();
      if (data.success && data.data) {
        return data.data.map((r: any) => `### ${r.title}\nURL: ${r.url}\n${r.markdown || r.description}`).join("\n\n");
      }
    } catch (e) {
      console.error("Firecrawl Search Error", e);
    }
  }

  // Fallback to Jina Search (which uses DuckDuckGo / Brave under the hood and returns markdown)
  try {
    const res = await fetch(`https://s.jina.ai/${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error(`Jina API returned ${res.status}`);
    return (await res.text()).substring(0, 8000);
  } catch (e: any) {
    return `Error en la búsqueda web: ${e.message}`;
  }
}

export async function performWebFetch(url: string, firecrawlKey?: string): Promise<string> {
  if (firecrawlKey) {
    try {
      const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${firecrawlKey}`
        },
        body: JSON.stringify({ url, formats: ["markdown"] })
      });
      const data = await res.json();
      if (data.success && data.data && data.data.markdown) {
        return data.data.markdown.substring(0, 15000); // Prevent massive context bloat
      }
    } catch (e) {
      console.error("Firecrawl Scrape Error", e);
    }
  }

  // Fallback to Jina Reader (free HTML to Markdown)
  try {
    const res = await fetch(`https://r.jina.ai/${encodeURIComponent(url)}`);
    if (!res.ok) throw new Error(`Jina API returned ${res.status}`);
    return (await res.text()).substring(0, 15000);
  } catch (e: any) {
    return `Error al extraer contenido de la URL: ${e.message}`;
  }
}

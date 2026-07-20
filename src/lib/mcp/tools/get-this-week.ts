import { defineTool } from "@lovable.dev/mcp-js";
import { getRegulatoryFeed } from "@/lib/news.functions";

export default defineTool({
  name: "get_this_week",
  title: "Get this week's AI governance briefing",
  description:
    "Return this week's curated AI governance stories from Responsible AI Pulse, ranked by significance. Each story includes headline, source, date, region, country, topic tag, one-sentence enterprise implication, and source URL, along with a short synthesis intro.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async () => {
    const feed = await getRegulatoryFeed();
    return {
      content: [{ type: "text", text: JSON.stringify(feed) }],
      structuredContent: feed as unknown as Record<string, unknown>,
    };
  },
});
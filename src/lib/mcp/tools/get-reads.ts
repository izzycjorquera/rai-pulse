import { defineTool } from "@lovable.dev/mcp-js";
import { READS } from "@/content/reads";

export default defineTool({
  name: "get_reads",
  title: "Get the Read of the Week list",
  description:
    "Return the Responsible AI Pulse Read of the Week list: curated papers, books, and podcast episodes on responsible AI, each with title, author or show, year, digest, why-it-matters tag, and link.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => ({
    content: [{ type: "text", text: JSON.stringify({ reads: READS }) }],
    structuredContent: { reads: READS },
  }),
});
import { defineTool } from "@lovable.dev/mcp-js";
import { MILESTONES } from "@/content/radar";

export default defineTool({
  name: "get_radar",
  title: "Get the AI governance radar",
  description:
    "Return the Responsible AI Pulse radar: upcoming and recent AI governance milestones (regulations, deadlines, obligations) with date, jurisdiction, title, description, enterprise implication, and status.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => ({
    content: [{ type: "text", text: JSON.stringify({ milestones: MILESTONES }) }],
    structuredContent: { milestones: MILESTONES },
  }),
});
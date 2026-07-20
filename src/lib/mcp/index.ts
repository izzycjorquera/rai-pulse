import { defineMcp } from "@lovable.dev/mcp-js";
import getThisWeekTool from "./tools/get-this-week";
import getRadarTool from "./tools/get-radar";
import getReadsTool from "./tools/get-reads";

export default defineMcp({
  name: "responsible-ai-pulse-mcp",
  title: "Responsible AI Pulse",
  version: "0.1.0",
  instructions:
    "Tools for Responsible AI Pulse, a weekly briefing on AI governance for enterprise readers. Use `get_this_week` for the current curated stories with enterprise implications, `get_radar` for upcoming AI governance milestones and deadlines, and `get_reads` for the recommended paper, book, and podcast picks.",
  tools: [getThisWeekTool, getRadarTool, getReadsTool],
});
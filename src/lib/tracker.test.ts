import { describe, expect, test } from "bun:test";
import type { FeedArticle } from "./news.functions";
import { aggregate, normaliseDirection, normaliseThemes, updateIndex, weekKey } from "./tracker";
import { parseSynthesis } from "./tracker.functions";

function article(overrides: Partial<FeedArticle>): FeedArticle {
  return {
    title: "Story",
    source: "Reuters",
    date: "today",
    summary: "",
    enterpriseImplication: "",
    url: "https://reuters.com/1",
    ...overrides,
  };
}

describe("normalisers", () => {
  test("themes keep known values, case-insensitively, deduplicated, max 3", () => {
    expect(
      normaliseThemes([
        "fragmentation",
        "Made up",
        "Sovereignty",
        "FRAGMENTATION",
        "Agentic AI",
        "Alignment",
      ]),
    ).toEqual(["Fragmentation", "Sovereignty", "Agentic AI"]);
  });

  test("non-array themes become empty", () => {
    expect(normaliseThemes("Fragmentation")).toEqual([]);
  });

  test("direction rejects unknown values", () => {
    expect(normaliseDirection("tightening")).toBe("Tightening");
    expect(normaliseDirection("sideways")).toBeUndefined();
  });
});

describe("weekKey", () => {
  test("maps any day to that week's Monday", () => {
    expect(weekKey("2026-11-04T10:00:00Z")).toBe("2026-11-02"); // Wednesday
    expect(weekKey("2026-11-02T00:00:00Z")).toBe("2026-11-02"); // Monday
    expect(weekKey("2026-11-08T23:59:00Z")).toBe("2026-11-02"); // Sunday
  });
});

describe("updateIndex", () => {
  test("adds newest first, deduplicates and caps", () => {
    expect(updateIndex(["2026-10-26", "2026-10-19"], "2026-11-02", 2)).toEqual([
      "2026-11-02",
      "2026-10-26",
    ]);
    expect(updateIndex(["2026-11-02"], "2026-11-02")).toEqual(["2026-11-02"]);
  });
});

describe("aggregate", () => {
  test("counts by theme and region, skips untagged, deduplicates across weeks", () => {
    const shared = article({
      url: "https://reuters.com/shared",
      region: "Europe",
      themes: ["Fragmentation", "Financial services"],
      direction: "Tightening",
    });
    const agg = aggregate([
      {
        week: "2026-10-26",
        updatedAt: "2026-10-26T07:00:00Z",
        articles: [shared],
      },
      {
        week: "2026-11-02",
        updatedAt: "2026-11-02T07:00:00Z",
        articles: [
          shared,
          article({
            url: "https://reuters.com/us",
            region: "North America",
            themes: ["Fragmentation"],
            direction: "Loosening",
          }),
          article({ url: "https://reuters.com/none", region: "Asia-Pacific" }),
        ],
      },
    ]);
    expect(agg.weeks).toEqual(["2026-11-02", "2026-10-26"]);
    expect(agg.totalTagged).toBe(2);
    expect(agg.matrix.Fragmentation.Europe).toBe(1);
    expect(agg.matrix.Fragmentation["North America"]).toBe(1);
    expect(agg.matrix["Financial services"].Europe).toBe(1);
    expect(agg.directionByTheme.Fragmentation).toEqual({ Tightening: 1, Loosening: 1, Neutral: 0 });
    // Newest week wins for a story that appears twice.
    expect(agg.itemsByTheme.Fragmentation.find((i) => i.url === shared.url)?.week).toBe(
      "2026-11-02",
    );
  });
});

describe("parseSynthesis", () => {
  const items = [
    article({ title: "A", url: "https://reuters.com/a" }),
    article({ title: "B", url: "https://reuters.com/b" }),
  ];

  test("maps reference numbers to sources and drops invalid ones", () => {
    const text = `{"c":{"t":"Both converge.","r":[0,1,1,9]},"d":{"t":"Split.","r":[1]},"w":{"t":"Watch B.","r":[]}}`;
    const s = parseSynthesis(text, items, "basis");
    expect(s?.converging.sources.map((x) => x.title)).toEqual(["A", "B"]);
    expect(s?.diverging.sources).toEqual([{ title: "B", url: "https://reuters.com/b" }]);
    expect(s?.watch.text).toBe("Watch B.");
  });

  test("returns null when a section is missing or JSON is broken", () => {
    expect(parseSynthesis(`{"c":{"t":"x","r":[]}}`, items, "b")).toBeNull();
    expect(parseSynthesis("no json here", items, "b")).toBeNull();
  });
});

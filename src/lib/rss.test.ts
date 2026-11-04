import { describe, expect, test } from "bun:test";
import { isAiRelevant, parseFeed, parseFeedDate } from "./rss";

describe("parseFeedDate", () => {
  test("parses RFC 822 (RSS 2.0)", () => {
    expect(parseFeedDate("Tue, 03 Nov 2026 15:00:00 +0000")).toBe("2026-11-03T15:00:00.000Z");
  });

  test("parses ISO 8601 (RSS 1.0 dc:date)", () => {
    expect(parseFeedDate("2026-11-03T00:00:00Z")).toBe("2026-11-03T00:00:00.000Z");
  });

  test("parses the FCA's non-standard format", () => {
    expect(parseFeedDate("Tuesday, November 3, 2026 - 10:03")).toBe("2026-11-03T10:03:00.000Z");
  });

  test("returns null for junk", () => {
    expect(parseFeedDate("not a date")).toBeNull();
    expect(parseFeedDate(undefined)).toBeNull();
  });
});

describe("parseFeed", () => {
  test("parses RSS 2.0 items with CDATA and entities", () => {
    const xml = `<rss version="2.0"><channel><title>FSB</title>
      <item><title><![CDATA[FSB finalises AI sound practices]]></title>
        <link>https://www.fsb.org/2026/10/ai/</link>
        <description>&lt;p&gt;Report on AI &amp; financial stability&lt;/p&gt;</description>
        <pubDate>Thu, 15 Oct 2026 10:00:00 +0000</pubDate></item>
    </channel></rss>`;
    expect(parseFeed(xml)).toEqual([
      {
        title: "FSB finalises AI sound practices",
        link: "https://www.fsb.org/2026/10/ai/",
        description: "Report on AI & financial stability",
        date: "2026-10-15T10:00:00.000Z",
      },
    ]);
  });

  test("parses RSS 1.0 (RDF) items with dc:date", () => {
    const xml = `<rdf:RDF><item rdf:about="https://www.bis.org/review/r261103a.htm">
      <title>Economic transitions - technology</title>
      <link>https://www.bis.org/review/r261103a.htm</link>
      <description>Speech on AI and productivity</description>
      <dc:date>2026-11-03T00:00:00Z</dc:date></item></rdf:RDF>`;
    const [item] = parseFeed(xml);
    expect(item.link).toBe("https://www.bis.org/review/r261103a.htm");
    expect(item.date).toBe("2026-11-03T00:00:00.000Z");
  });

  test("drops items without a title or an http(s) link", () => {
    const xml = `<item><title>No link</title></item><item><title></title><link>https://x.org</link></item>`;
    expect(parseFeed(xml)).toEqual([]);
  });
});

describe("isAiRelevant", () => {
  test("matches AI terms", () => {
    expect(isAiRelevant({ title: "Philip R. Lane: AI adoption in Europe", description: "" })).toBe(
      true,
    );
    expect(
      isAiRelevant({ title: "Speech", description: "on machine learning in supervision" }),
    ).toBe(true);
  });

  test("does not match AI inside other words", () => {
    expect(
      isAiRelevant({
        title: "Minutes of the Court",
        description: "The Governor said rates remain",
      }),
    ).toBe(false);
  });
});

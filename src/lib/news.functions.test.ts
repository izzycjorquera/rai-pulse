import { describe, expect, test } from "bun:test";
import { extractJsonArray, isAllowedUrl, relativeDate } from "./news.functions";

describe("isAllowedUrl", () => {
  const domains = ["reuters.com", "bbc.co.uk"];

  test("allows an exact allowlisted host", () => {
    expect(isAllowedUrl("https://reuters.com/article/1", domains)).toBe(true);
  });

  test("allows a subdomain of an allowlisted host", () => {
    expect(isAllowedUrl("https://www.bbc.co.uk/news/1", domains)).toBe(true);
  });

  test("rejects a host that merely contains the allowlisted domain", () => {
    expect(isAllowedUrl("https://notreuters.com/article/1", domains)).toBe(false);
  });

  test("rejects a lookalike host with the domain as a subpath decoy", () => {
    expect(isAllowedUrl("https://reuters.com.evil.example/1", domains)).toBe(false);
  });

  test("rejects malformed URLs instead of throwing", () => {
    expect(isAllowedUrl("not a url", domains)).toBe(false);
  });
});

describe("extractJsonArray", () => {
  test("parses a bare JSON array", () => {
    expect(extractJsonArray('[{"i":0,"r":"EU"}]')).toEqual([{ i: 0, r: "EU" }]);
  });

  test("pulls the array out of surrounding prose", () => {
    expect(extractJsonArray('Here is the result:\n[{"i":1,"r":"NA"}]\nHope that helps.')).toEqual([
      { i: 1, r: "NA" },
    ]);
  });

  test("returns null when there is no array", () => {
    expect(extractJsonArray("no json here")).toBeNull();
  });

  test("returns null for malformed JSON", () => {
    expect(extractJsonArray("[{broken json]")).toBeNull();
  });

  test("returns null when brackets never close", () => {
    expect(extractJsonArray('prefix [1, then "unterminated')).toBeNull();
  });
});

describe("relativeDate", () => {
  test("returns 'today' for a timestamp from earlier today", () => {
    expect(relativeDate(new Date().toISOString())).toBe("today");
  });

  test("returns '1 day ago' for yesterday", () => {
    const yesterday = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
    expect(relativeDate(yesterday)).toBe("1 day ago");
  });

  test("returns 'N days ago' within the same week", () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 86_400_000).toISOString();
    expect(relativeDate(threeDaysAgo)).toBe("3 days ago");
  });

  test("returns 'N weeks ago' after a week", () => {
    const twoWeeksAgo = new Date(Date.now() - 15 * 86_400_000).toISOString();
    expect(relativeDate(twoWeeksAgo)).toBe("2 weeks ago");
  });

  test("returns 'N months ago' after five weeks", () => {
    const twoMonthsAgo = new Date(Date.now() - 65 * 86_400_000).toISOString();
    expect(relativeDate(twoMonthsAgo)).toBe("2 months ago");
  });

  test("returns empty string for an unparseable date", () => {
    expect(relativeDate("not a date")).toBe("");
  });
});

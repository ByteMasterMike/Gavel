import { describe, expect, it } from "vitest";
import { parseCaseImportJson, safeParseCaseImportJson } from "./schema";

const minimalValid = {
  title: "Test Case",
  tier: 1,
  kind: "CRIMINAL",
  category: "Test",
  briefSummary: "Brief.",
  parTimeMinutes: 8,
  correctVerdict: "GUILTY",
  correctSentenceText: "$100 fine.",
  correctReasoningSummary: "Summary.",
  actualOpinionExcerpt: "The court finds...",
  isOverturned: false,
  whyExplanation: "Because.",
  maxPrecedents: 3,
  documents: [
    {
      title: "Doc A",
      content: "Content.",
      sortOrder: 0,
      isAdmissible: true,
      isMaterial: true,
    },
  ],
  precedents: [
    {
      name: "P1",
      citation: "1 U.S. 1 (2000)",
      summary: "Summary.",
      sortOrder: 0,
      isRelevant: true,
      weightMultiplier: 1.5,
    },
  ],
};

describe("caseImportSchema", () => {
  it("parses minimal valid payload", () => {
    const data = parseCaseImportJson(minimalValid);
    expect(data.title).toBe("Test Case");
    expect(data.requiresSubscription).toBe(false);
    expect(data.appellateSeat).toBe(false);
  });

  it("parses appellateSeat when true", () => {
    const data = parseCaseImportJson({ ...minimalValid, appellateSeat: true });
    expect(data.appellateSeat).toBe(true);
  });

  it("rejects empty documents", () => {
    const r = safeParseCaseImportJson({ ...minimalValid, documents: [] });
    expect(r.success).toBe(false);
  });

  it("rejects invalid kind", () => {
    const r = safeParseCaseImportJson({ ...minimalValid, kind: "FELONY" });
    expect(r.success).toBe(false);
  });
});

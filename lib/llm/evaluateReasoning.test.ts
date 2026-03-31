import { describe, expect, it } from "vitest";
import { formatReasoningFeedbackForDisplay, parseReasoningEvaluation } from "./evaluateReasoning";

const imp = ["First concrete step.", "Second concrete step."];

describe("parseReasoningEvaluation", () => {
  it("parses valid JSON with improvements", () => {
    expect(
      parseReasoningEvaluation(
        `{"score":0.75,"feedback":"Solid analysis.","improvements":${JSON.stringify(imp)}}`,
      ),
    ).toEqual({
      score: 0.75,
      feedback: "Solid analysis.",
      improvements: imp,
    });
  });

  it("strips markdown fences and parses", () => {
    const raw = `\`\`\`json\n{"score": 0.2, "feedback": "Needs work.", "improvements": ${JSON.stringify(imp)}}\n\`\`\``;
    expect(parseReasoningEvaluation(raw)).toEqual({
      score: 0.2,
      feedback: "Needs work.",
      improvements: imp,
    });
  });

  it("recovers score from truncated JSON with default improvements", () => {
    expect(parseReasoningEvaluation('{"score": 0.8,')).toEqual({
      score: 0.8,
      feedback: "Evaluation truncated.",
      improvements: [
        "Tighten each finding of fact so it clearly supports your legal conclusion.",
        "Apply each cited precedent in one or two precise sentences tied to specific facts.",
      ],
    });
  });

  it("returns null when score is out of range (strict JSON)", () => {
    expect(
      parseReasoningEvaluation(
        `{"score": 2, "feedback": "x", "improvements": ${JSON.stringify(imp)}}`,
      ),
    ).toBeNull();
  });

  it("returns null when loose score is out of range", () => {
    expect(parseReasoningEvaluation('{"score": 1.5,')).toBeNull();
  });

  it("extracts feedback when present in loose parse", () => {
    const partial = '{"score":0.3,"feedback":"Short note"';
    expect(parseReasoningEvaluation(partial)).toEqual({
      score: 0.3,
      feedback: "Short note",
      improvements: [
        "Tighten each finding of fact so it clearly supports your legal conclusion.",
        "Apply each cited precedent in one or two precise sentences tied to specific facts.",
      ],
    });
  });

  it("pads a single improvement to two items", () => {
    const one = ["Only one tip"];
    const parsed = parseReasoningEvaluation(
      `{"score":0.6,"feedback":"Ok.","improvements":${JSON.stringify(one)}}`,
    );
    expect(parsed?.improvements).toHaveLength(2);
    expect(parsed?.improvements[0]).toBe("Only one tip");
  });

  it("truncates more than four improvements", () => {
    const many = ["a", "b", "c", "d", "e"];
    const parsed = parseReasoningEvaluation(
      `{"score":0.5,"feedback":"x","improvements":${JSON.stringify(many)}}`,
    );
    expect(parsed?.improvements).toEqual(["a", "b", "c", "d"]);
  });
});

describe("formatReasoningFeedbackForDisplay", () => {
  it("formats summary and bullets", () => {
    const s = formatReasoningFeedbackForDisplay({
      score: 0.7,
      feedback: "Overall solid.",
      improvements: ["Do X", "Do Y"],
    });
    expect(s).toContain("Summary");
    expect(s).toContain("Overall solid.");
    expect(s).toContain("How to improve");
    expect(s).toContain("• Do X");
    expect(s).toContain("• Do Y");
  });

  it("omits bullets when improvements empty", () => {
    const s = formatReasoningFeedbackForDisplay({
      score: 0.5,
      feedback: "Budget mode.",
      improvements: [],
    });
    expect(s).toContain("Summary");
    expect(s).toContain("Budget mode.");
    expect(s).not.toContain("How to improve");
  });
});

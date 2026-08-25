import { describe, expect, it } from "vitest";
import { createAssessmentInput } from "./routers";

const validPayload = {
  id: "assessment-001",
  ownerKey: "browser-owner-key-001",
  title: "Biology term paper",
  studentName: "Aarav Nair",
  questionPaperName: "biology.pdf",
  answerSheetName: "aarav.pdf",
  questions: [{
    id: "question-001",
    questionNumber: "1 (a)",
    sortOrder: 1,
    text: "Define photosynthesis.",
    marks: 2,
    mappingStatus: "mapped" as const,
    confidence: 98,
    answerPage: 1,
  }],
  regions: [{
    id: "region-001",
    questionId: "question-001",
    pageNumber: 1,
    topPercent: 20,
    leftPercent: 8,
    widthPercent: 80,
    heightPercent: 12,
    confidence: 98,
  }],
};

describe("assessment persistence input", () => {
  it("accepts labelled sub-parts and exact mapped evidence regions", () => {
    expect(createAssessmentInput.parse(validPayload).questions[0]?.questionNumber).toBe("1 (a)");
  });

  it("rejects invalid answer-region bounds", () => {
    expect(() => createAssessmentInput.parse({ ...validPayload, regions: [{ ...validPayload.regions[0], heightPercent: 0 }] })).toThrow();
  });
});

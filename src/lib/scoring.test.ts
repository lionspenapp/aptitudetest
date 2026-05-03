import { describe, it, expect } from "vitest";
import {
  calculateGEScore,
  getPercentileBand,
  calculateGrowthGap,
  identifyWeakTypes,
  getHighestTierReached,
  generateLocalReport,
} from "./scoring";

describe("calculateGEScore", () => {
  it("returns 0 for empty array", () => {
    expect(calculateGEScore([])).toBe(0);
  });

  it("returns the single value for one-element array", () => {
    expect(calculateGEScore([5])).toBe(5);
  });

  it("averages difficulty weights and rounds to one decimal", () => {
    expect(calculateGEScore([3, 5, 7])).toBe(5);
    expect(calculateGEScore([3, 4])).toBe(3.5);
    expect(calculateGEScore([1, 2, 3, 4, 5, 6])).toBe(3.5);
  });

  it("rounds correctly for repeating decimals", () => {
    expect(calculateGEScore([1, 1, 2])).toBe(1.3);
  });
});

describe("getPercentileBand", () => {
  it("returns 'Superior' for ≥90%", () => {
    expect(getPercentileBand(18, 20)).toBe("Superior");
    expect(getPercentileBand(20, 20)).toBe("Superior");
  });

  it("returns 'Above Average' for 75–89%", () => {
    expect(getPercentileBand(15, 20)).toBe("Above Average");
    expect(getPercentileBand(17, 20)).toBe("Above Average");
  });

  it("returns 'Average' for 50–74%", () => {
    expect(getPercentileBand(10, 20)).toBe("Average");
    expect(getPercentileBand(14, 20)).toBe("Average");
  });

  it("returns 'Developing' for 25–49%", () => {
    expect(getPercentileBand(5, 20)).toBe("Developing");
    expect(getPercentileBand(9, 20)).toBe("Developing");
  });

  it("returns 'Needs Support' for <25%", () => {
    expect(getPercentileBand(0, 20)).toBe("Needs Support");
    expect(getPercentileBand(4, 20)).toBe("Needs Support");
  });
});

describe("calculateGrowthGap", () => {
  it("returns 0 when GE equals enrolled grade", () => {
    expect(calculateGrowthGap(5, 5)).toBe(0);
  });

  it("returns positive gap when above grade level", () => {
    expect(calculateGrowthGap(7.2, 5)).toBe(2.2);
  });

  it("returns negative gap when below grade level", () => {
    expect(calculateGrowthGap(3.5, 6)).toBe(-2.5);
  });
});

describe("identifyWeakTypes", () => {
  it("returns empty array when no answers", () => {
    expect(identifyWeakTypes([])).toEqual([]);
  });

  it("returns types with ≥50% wrong", () => {
    const answers = [
      { type: "pattern" as const, correct: false },
      { type: "pattern" as const, correct: false },
      { type: "analogy" as const, correct: true },
      { type: "analogy" as const, correct: true },
    ];
    expect(identifyWeakTypes(answers)).toEqual(["pattern"]);
  });

  it("includes types with exactly 50% wrong", () => {
    const answers = [
      { type: "vocab" as const, correct: true },
      { type: "vocab" as const, correct: false },
    ];
    expect(identifyWeakTypes(answers)).toEqual(["vocab"]);
  });

  it("returns multiple weak types", () => {
    const answers = [
      { type: "pattern" as const, correct: false },
      { type: "analogy" as const, correct: false },
    ];
    const result = identifyWeakTypes(answers);
    expect(result).toContain("pattern");
    expect(result).toContain("analogy");
  });
});

describe("getHighestTierReached", () => {
  it("returns 1 for empty history", () => {
    expect(getHighestTierReached([])).toBe(1);
  });

  it("returns max tier from history", () => {
    expect(getHighestTierReached([1, 2, 3, 2])).toBe(3);
    expect(getHighestTierReached([2, 2, 2])).toBe(2);
    expect(getHighestTierReached([1, 2, 3, 4])).toBe(4);
  });
});

describe("generateLocalReport", () => {
  it("computes a complete report from raw session data", () => {
    const report = generateLocalReport({
      studentName: "Test Student",
      enrolledGrade: 5,
      module: "quantitative",
      rawScore: 14,
      totalQuestions: 20,
      correctDifficultyWeights: [3, 4, 5, 6, 7, 5, 6, 7, 8, 5, 6, 7, 8, 9],
      tierHistory: [2, 2, 2, 3, 3, 3, 4],
      answers: [
        { type: "pattern", correct: true },
        { type: "pattern", correct: true },
        { type: "analogy", correct: false },
        { type: "analogy", correct: false },
        { type: "reasoning", correct: true },
      ],
    });

    expect(report.studentName).toBe("Test Student");
    expect(report.enrolledGrade).toBe(5);
    expect(report.module).toBe("quantitative");
    expect(report.rawScore).toBe(14);
    expect(report.totalQuestions).toBe(20);
    expect(report.geScore).toBe(6.1);
    expect(report.percentileBand).toBe("Average");
    expect(report.growthGap).toBe(1.1);
    expect(report.tierReached).toBe(4);
    expect(report.weakTypes).toEqual(["analogy"]);
  });
});

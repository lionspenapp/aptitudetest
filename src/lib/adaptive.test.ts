import { describe, it, expect } from "vitest";
import { getStartingTier, adjustTier } from "./adaptive";

describe("getStartingTier", () => {
  it("returns Tier 1 for grades 3–4", () => {
    expect(getStartingTier(3)).toBe(1);
    expect(getStartingTier(4)).toBe(1);
  });

  it("returns Tier 2 for grades 5–6", () => {
    expect(getStartingTier(5)).toBe(2);
    expect(getStartingTier(6)).toBe(2);
  });

  it("returns Tier 3 for grades 7–8", () => {
    expect(getStartingTier(7)).toBe(3);
    expect(getStartingTier(8)).toBe(3);
  });
});

describe("adjustTier", () => {
  describe("level up (3 correct in a row)", () => {
    it("advances from Tier 1 to Tier 2", () => {
      const result = adjustTier(1, 3, 0);
      expect(result.newTier).toBe(2);
      expect(result.shouldEnd).toBe(false);
      expect(result.resetCorrect).toBe(true);
      expect(result.resetIncorrect).toBe(true);
    });

    it("advances from Tier 2 to Tier 3", () => {
      const result = adjustTier(2, 3, 0);
      expect(result.newTier).toBe(3);
      expect(result.shouldEnd).toBe(false);
    });

    it("advances from Tier 3 to Tier 4", () => {
      const result = adjustTier(3, 3, 0);
      expect(result.newTier).toBe(4);
      expect(result.shouldEnd).toBe(false);
    });

    it("ends the test at Tier 4 ceiling", () => {
      const result = adjustTier(4, 3, 0);
      expect(result.newTier).toBe(4);
      expect(result.shouldEnd).toBe(true);
      expect(result.resetCorrect).toBe(true);
    });
  });

  describe("level down (2 incorrect)", () => {
    it("drops from Tier 3 to Tier 2", () => {
      const result = adjustTier(3, 0, 2);
      expect(result.newTier).toBe(2);
      expect(result.shouldEnd).toBe(false);
      expect(result.resetCorrect).toBe(true);
      expect(result.resetIncorrect).toBe(true);
    });

    it("drops from Tier 2 to Tier 1", () => {
      const result = adjustTier(2, 0, 2);
      expect(result.newTier).toBe(1);
      expect(result.shouldEnd).toBe(false);
    });

    it("ends the test at Tier 1 floor", () => {
      const result = adjustTier(1, 0, 2);
      expect(result.newTier).toBe(1);
      expect(result.shouldEnd).toBe(true);
      expect(result.resetCorrect).toBe(true);
    });
  });

  describe("no tier change", () => {
    it("stays at current tier with fewer than 3 correct", () => {
      const result = adjustTier(2, 2, 0);
      expect(result.newTier).toBe(2);
      expect(result.shouldEnd).toBe(false);
      expect(result.resetCorrect).toBe(false);
      expect(result.resetIncorrect).toBe(false);
    });

    it("stays at current tier with fewer than 2 incorrect", () => {
      const result = adjustTier(3, 0, 1);
      expect(result.newTier).toBe(3);
      expect(result.shouldEnd).toBe(false);
      expect(result.resetCorrect).toBe(false);
      expect(result.resetIncorrect).toBe(false);
    });

    it("stays at current tier with zero streaks", () => {
      const result = adjustTier(2, 0, 0);
      expect(result.newTier).toBe(2);
      expect(result.shouldEnd).toBe(false);
    });
  });
});

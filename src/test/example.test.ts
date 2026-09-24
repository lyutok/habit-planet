import { describe, it, expect } from "vitest";
import { calculateStreak } from "@/hooks/useRemoteHabits";

describe("example", () => {
  it("should pass", () => {
    expect(true).toBe(true);
  });
});

describe("calculateStreak", () => {
  it("keeps the last completed streak visible on the following day", () => {
    const entries = [{ habitId: "steak", date: "2026-09-23", completed: true }];

    expect(calculateStreak("steak", entries, "2026-09-23")).toBe(1);
    expect(calculateStreak("steak", entries, "2026-09-24")).toBe(1);
  });

  it("counts today's completion as the next streak increment", () => {
    const entries = [
      { habitId: "steak", date: "2026-09-23", completed: true },
      { habitId: "steak", date: "2026-09-24", completed: true },
    ];

    expect(calculateStreak("steak", entries, "2026-09-24")).toBe(2);
  });

  it("does not count completions from the future", () => {
    const entries = [{ habitId: "steak", date: "2026-09-25", completed: true }];

    expect(calculateStreak("steak", entries, "2026-09-24")).toBe(0);
  });
});

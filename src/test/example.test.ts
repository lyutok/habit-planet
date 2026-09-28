import { describe, it, expect } from "vitest";
import { calculateStreak } from "@/hooks/useRemoteHabits";
import { getCrossedMilestone } from "@/types/habits";

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

  it("continues a simulated streak from its saved entries", () => {
    const entries = Array.from({ length: 30 }, (_, index) => {
      const date = new Date(Date.UTC(2026, 0, index + 1)).toISOString().slice(0, 10);
      return { habitId: "reading", date, completed: true };
    });
    const nextEntry = { habitId: "reading", date: "2026-01-31", completed: true };

    expect(calculateStreak("reading", [...entries, nextEntry], nextEntry.date)).toBe(31);
  });

  it("keeps two habit streaks independent while advancing the same dates", () => {
    const entries = Array.from({ length: 31 }, (_, index) => {
      const date = new Date(Date.UTC(2026, 0, index + 1)).toISOString().slice(0, 10);
      return [
        { habitId: "reading", date, completed: true },
        ...(index >= 24 ? [{ habitId: "writing", date, completed: true }] : []),
      ];
    }).flat();

    expect(calculateStreak("reading", entries, "2026-01-31")).toBe(31);
    expect(calculateStreak("writing", entries, "2026-01-31")).toBe(7);
  });
});

describe("getCrossedMilestone", () => {
  it.each([
    [6, 7, 7],
    [29, 30, 30],
    [99, 100, 100],
  ])("returns the milestone when a streak crosses %i to %i", (previous, current, milestone) => {
    expect(getCrossedMilestone(previous, current)?.streak).toBe(milestone);
  });

  it("does not return an already achieved milestone again", () => {
    expect(getCrossedMilestone(7, 8)).toBeUndefined();
  });

  it("does not return a milestone when the streak has not reached it", () => {
    expect(getCrossedMilestone(5, 6)).toBeUndefined();
  });
});

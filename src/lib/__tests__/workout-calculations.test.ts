import {
  bestPerformance,
  calculateVolume,
  compareSetPerformance,
  formatDuration,
  isPersonalRecord,
} from "@/lib/workout-calculations";

describe("calculateVolume", () => {
  it("sums weight × reps across completed sets", () => {
    expect(
      calculateVolume([
        { weight: 100, reps: 5, completed: true },
        { weight: 80, reps: 10, completed: true },
      ]),
    ).toBe(1300);
  });

  it("ignores sets that were never completed", () => {
    expect(
      calculateVolume([
        { weight: 100, reps: 5, completed: true },
        { weight: 999, reps: 999, completed: false },
      ]),
    ).toBe(500);
  });

  it("treats missing weight or reps as zero rather than producing NaN", () => {
    expect(
      calculateVolume([
        { weight: null, reps: 10, completed: true },
        { weight: 50, reps: null, completed: true },
      ]),
    ).toBe(0);
  });

  it("is zero for an empty list", () => {
    expect(calculateVolume([])).toBe(0);
  });
});

describe("formatDuration", () => {
  it("drops the hour segment under an hour", () => {
    expect(formatDuration(0)).toBe("0:00");
    expect(formatDuration(65)).toBe("1:05");
    expect(formatDuration(599)).toBe("9:59");
  });

  it("shows hours once past one, zero-padding minutes", () => {
    expect(formatDuration(3600)).toBe("1:00:00");
    expect(formatDuration(3661)).toBe("1:01:01");
  });

  it("clamps negatives to zero instead of rendering a negative clock", () => {
    expect(formatDuration(-30)).toBe("0:00");
  });

  it("floors fractional seconds", () => {
    expect(formatDuration(59.9)).toBe("0:59");
  });
});

describe("compareSetPerformance", () => {
  it("ranks heavier weight above lighter regardless of reps", () => {
    expect(
      compareSetPerformance({ weight: 100, reps: 1 }, { weight: 90, reps: 20 }),
    ).toBeGreaterThan(0);
  });

  it("breaks equal weight with reps", () => {
    expect(
      compareSetPerformance({ weight: 5, reps: 3 }, { weight: 5, reps: 1 }),
    ).toBeGreaterThan(0);
  });

  it("returns zero for identical sets", () => {
    expect(compareSetPerformance({ weight: 60, reps: 8 }, { weight: 60, reps: 8 })).toBe(0);
  });
});

describe("bestPerformance", () => {
  it("is null for an empty list", () => {
    expect(bestPerformance([])).toBeNull();
  });

  it("picks the heaviest set", () => {
    expect(
      bestPerformance([
        { weight: 60, reps: 10 },
        { weight: 80, reps: 3 },
        { weight: 70, reps: 8 },
      ]),
    ).toEqual({ weight: 80, reps: 3 });
  });

  it("keeps the first set when a later one only ties it", () => {
    const first = { weight: 60, reps: 8, id: "first" };
    const tie = { weight: 60, reps: 8, id: "tie" };
    expect(bestPerformance([first, tie])).toBe(first);
  });
});

describe("isPersonalRecord", () => {
  it("counts the first real set as a record", () => {
    expect(isPersonalRecord({ weight: 60, reps: 5 }, null)).toBe(true);
  });

  it("rejects bodyweight-only sets so they never claim a weight record", () => {
    expect(isPersonalRecord({ weight: 0, reps: 50 }, null)).toBe(false);
    expect(isPersonalRecord({ weight: null, reps: 50 }, null)).toBe(false);
  });

  it("requires strictly beating the prior best — a tie is not a record", () => {
    const prior = { weight: 60, reps: 8 };
    expect(isPersonalRecord({ weight: 60, reps: 8 }, prior)).toBe(false);
    expect(isPersonalRecord({ weight: 60, reps: 9 }, prior)).toBe(true);
    expect(isPersonalRecord({ weight: 61, reps: 1 }, prior)).toBe(true);
  });

  it("does not award a record for more reps at a lighter weight", () => {
    expect(isPersonalRecord({ weight: 50, reps: 20 }, { weight: 60, reps: 8 })).toBe(false);
  });
});

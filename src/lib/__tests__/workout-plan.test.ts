import {
  DEFAULT_SET_COUNT,
  defaultPlannedSet,
  defaultPlannedSets,
  describeSets,
  rangeLabel,
  type PlannedSet,
} from "@/lib/workout-plan";

const set = (repsMin: number | null, repsMax: number | null): PlannedSet => ({
  repsMin,
  repsMax,
  rir: null,
});

describe("rangeLabel", () => {
  it("renders a range with an en dash", () => {
    expect(rangeLabel(set(8, 12))).toBe("8–12");
  });

  it("collapses a range whose ends match to a single number", () => {
    expect(rangeLabel(set(10, 10))).toBe("10");
  });

  it("falls back to whichever end is specified", () => {
    expect(rangeLabel(set(8, null))).toBe("8");
    expect(rangeLabel(set(null, 12))).toBe("12");
  });

  it("renders an em dash when nothing is prescribed", () => {
    expect(rangeLabel(set(null, null))).toBe("—");
  });
});

describe("describeSets", () => {
  it("collapses a uniform plan to 'count × range'", () => {
    expect(describeSets([set(8, 12), set(8, 12), set(8, 12)])).toBe("3 × 8–12");
  });

  it("lists each set when the plan varies, so a pyramid stays visible", () => {
    expect(describeSets([set(12, 12), set(10, 10), set(8, 8)])).toBe("12 · 10 · 8");
  });

  it("treats a single differing set as varying, not uniform", () => {
    expect(describeSets([set(8, 12), set(8, 12), set(8, 10)])).toBe("8–12 · 8–12 · 8–10");
  });

  it("still uses the collapsed form for one set", () => {
    expect(describeSets([set(8, 12)])).toBe("1 × 8–12");
  });

  it("renders an em dash for an empty plan", () => {
    expect(describeSets([])).toBe("—");
  });

  it("compares rendered labels, not raw fields — 10 and 10–10 are the same plan", () => {
    expect(describeSets([set(10, 10), set(10, null)])).toBe("2 × 10");
  });
});

describe("defaults", () => {
  it("gives a newly added exercise three sets of 8–12", () => {
    const sets = defaultPlannedSets();
    expect(sets).toHaveLength(DEFAULT_SET_COUNT);
    expect(describeSets(sets)).toBe("3 × 8–12");
  });

  it("returns independent set objects so editing one never changes another", () => {
    const sets = defaultPlannedSets();
    sets[0].repsMax = 20;
    expect(sets[1].repsMax).toBe(12);
  });

  it("leaves RIR unset by default", () => {
    expect(defaultPlannedSet().rir).toBeNull();
  });
});

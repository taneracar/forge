import { targetsFor } from "@/lib/nutrition-targets";

/**
 * Expected values are worked out from the Mifflin-St Jeor definition by hand,
 * not by running the module — otherwise these would only assert that the code
 * equals itself. A silent formula error here produces a plausible-looking but
 * wrong calorie target that nobody would notice.
 */
const complete = {
  age: 26,
  gender: "male",
  height_cm: 178,
  weight_kg: 75,
  goal: "bulk",
  activity_level: "orta-aktif",
};

describe("targetsFor", () => {
  it("matches the formula for a complete profile", () => {
    // BMR 1737.5 × 1.55 activity × 1.15 bulk → 3100 (rounded to 10)
    expect(targetsFor(complete)).toEqual({
      calories: 3100,
      proteinG: 135,
      carbsG: 447,
      fatG: 86,
    });
  });

  it("applies the female constant and the cut multiplier", () => {
    expect(
      targetsFor({
        age: 30,
        gender: "female",
        height_cm: 165,
        weight_kg: 60,
        goal: "cut",
        activity_level: "az-aktif",
      }),
    ).toEqual({ calories: 1450, proteinG: 132, carbsG: 141, fatG: 40 });
  });

  it("places 'other' between the male and female constants", () => {
    const base = {
      age: 40,
      height_cm: 170,
      weight_kg: 70,
      goal: "maintain",
      activity_level: "hareketsiz",
    };
    const male = targetsFor({ ...base, gender: "male" }).calories;
    const other = targetsFor({ ...base, gender: "other" }).calories;
    const female = targetsFor({ ...base, gender: "female" }).calories;

    expect(male).toBe(1880);
    expect(other).toBe(1780);
    expect(female).toBe(1680);
    expect(male).toBeGreaterThan(other);
    expect(other).toBeGreaterThan(female);
  });

  it("raises protein on a cut and keeps it lower on a bulk", () => {
    const base = {
      age: 30,
      gender: "male",
      height_cm: 180,
      weight_kg: 80,
      activity_level: "orta-aktif",
    };
    expect(targetsFor({ ...base, goal: "cut" }).proteinG).toBe(176); // 80 × 2.2
    expect(targetsFor({ ...base, goal: "bulk" }).proteinG).toBe(144); // 80 × 1.8
  });

  it("orders the goals: bulk > maintain > recomp > cut", () => {
    const base = {
      age: 30,
      gender: "male",
      height_cm: 180,
      weight_kg: 80,
      activity_level: "orta-aktif",
    };
    const cal = (goal: string) => targetsFor({ ...base, goal }).calories;
    expect(cal("bulk")).toBeGreaterThan(cal("maintain"));
    expect(cal("maintain")).toBeGreaterThan(cal("recomp"));
    expect(cal("recomp")).toBeGreaterThan(cal("cut"));
  });

  it("falls back rather than deriving a target from missing measurements", () => {
    const fallback = { calories: 2200, proteinG: 140, carbsG: 240, fatG: 61 };
    expect(targetsFor({ ...complete, age: null })).toEqual(fallback);
    expect(targetsFor({ ...complete, height_cm: null })).toEqual(fallback);
    expect(targetsFor({ ...complete, weight_kg: null })).toEqual(fallback);
  });

  it("falls back to moderate activity and no goal adjustment for unknown slugs", () => {
    const unknown = targetsFor({
      ...complete,
      activity_level: "not-a-real-level",
      goal: "not-a-real-goal",
    });
    // 1737.5 × 1.375 default activity × 1.0 default goal → 2390
    expect(unknown.calories).toBe(2390);
  });

  it("never produces negative carbs, however lopsided the inputs", () => {
    for (const weight of [40, 60, 90, 120, 200]) {
      for (const goal of ["bulk", "cut", "maintain", "recomp"]) {
        const t = targetsFor({
          ...complete,
          weight_kg: weight,
          goal,
          activity_level: "hareketsiz",
        });
        expect(t.carbsG).toBeGreaterThanOrEqual(0);
      }
    }
  });
});

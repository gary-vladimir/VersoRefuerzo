import { describe, it, expect } from "vitest";
import { planChunks, stageForReps } from "@/lib/srs/chunk";

describe("planChunks", () => {
  it("returns one chunk for short verses", () => {
    const plan = planChunks("Yo soy el camino, la verdad y la vida.");
    expect(plan.chunks).toHaveLength(1);
    expect(plan.visibleAtStage(0)).toBe("Yo soy el camino, la verdad y la vida.");
    expect(plan.visibleAtStage(2)).toBe("Yo soy el camino, la verdad y la vida.");
  });

  it("splits 25-50 word verses into two chunks at punctuation", () => {
    const text =
      "Y sabemos que para los que aman a Dios todas las cosas cooperan para bien, esto es, para los que son llamados conforme a su propósito; porque a los que de antemano conoció.";
    const plan = planChunks(text);
    expect(plan.chunks.length).toBe(2);
    // Cumulative grow-out
    expect(plan.visibleAtStage(0)).toBe(plan.chunks[0]!);
    expect(plan.visibleAtStage(1).startsWith(plan.chunks[0]!)).toBe(true);
  });

  it("splits > 50 word verses into three chunks", () => {
    const t = (
      "Padre nuestro que estás en los cielos, santificado sea tu nombre; venga tu " +
      "reino, hágase tu voluntad como en el cielo así también en la tierra; el pan " +
      "nuestro de cada día dánoslo hoy, y perdónanos nuestras deudas como también " +
      "nosotros perdonamos a nuestros deudores, y no nos metas en tentación, mas " +
      "líbranos del mal."
    );
    const plan = planChunks(t);
    expect(plan.chunks.length).toBe(3);
    expect(plan.visibleAtStage(2)).toContain(plan.chunks[2]!);
  });
});

describe("stageForReps", () => {
  it("ramps cumulatively", () => {
    expect(stageForReps(0, 3)).toBe(0);
    expect(stageForReps(2, 3)).toBe(0);
    expect(stageForReps(3, 3)).toBe(1);
    expect(stageForReps(5, 3)).toBe(1);
    expect(stageForReps(6, 3)).toBe(2);
    expect(stageForReps(20, 3)).toBe(2);
  });
  it("clamps to available chunks", () => {
    expect(stageForReps(20, 1)).toBe(0);
    expect(stageForReps(20, 2)).toBe(1);
  });
});

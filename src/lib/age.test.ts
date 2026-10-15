import { describe, it, expect } from "vitest";
import { getAge } from "./age";

describe("getAge", () => {
  it("counts full years after the birthday", () => {
    expect(getAge("2003-09-03", new Date(2026, 9, 15))).toBe(23);
  });
  it("does not count the year before the birthday", () => {
    expect(getAge("2003-09-03", new Date(2026, 8, 2))).toBe(22);
  });
  it("counts the year on the birthday itself", () => {
    expect(getAge("2003-09-03", new Date(2026, 8, 3))).toBe(23);
  });
});

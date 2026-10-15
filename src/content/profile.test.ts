import { describe, it, expect } from "vitest";
import { profile, isPlaceholder } from "./profile";
import { getAge } from "@/lib/age";

describe("profile", () => {
  it("lists the journey nodes in story order", () => {
    expect(profile.nodes.map((n) => n.id)).toEqual(["boot", "web", "ml", "avitec"]);
  });
  it("has a valid ISO birth date that makes Mahdi 23 on 2026-10-15", () => {
    expect(getAge(profile.birthDate, new Date(2026, 9, 15))).toBe(23);
  });
});

describe("isPlaceholder", () => {
  it("flags TODO values", () => expect(isPlaceholder("TODO(mahdi): x")).toBe(true));
  it("accepts real values", () => expect(isPlaceholder("https://github.com/mahdi")).toBe(false));
});

import { cn } from "@/lib/cn";

describe("cn", () => {
  it("joins class names with single spaces", () => {
    expect(cn("px-4", "py-2")).toBe("px-4 py-2");
  });

  it("skips false, null, undefined and empty strings", () => {
    const fullWidth = false;
    expect(cn("btn", fullWidth && "w-full", null, undefined, "", "text-sm")).toBe("btn text-sm");
  });

  it("returns an empty string when nothing is truthy", () => {
    expect(cn(false, null, undefined)).toBe("");
  });
});

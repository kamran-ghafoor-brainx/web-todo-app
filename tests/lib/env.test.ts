import { parseEnv } from "@/lib/env";

describe("parseEnv", () => {
  it("parses valid values and converts VITE_USE_MOCK to a boolean", () => {
    expect(parseEnv({ VITE_API_URL: "/api", VITE_USE_MOCK: "true" })).toEqual({
      VITE_API_URL: "/api",
      VITE_USE_MOCK: true,
    });
  });

  it("accepts an absolute URL and strips trailing slashes", () => {
    expect(parseEnv({ VITE_API_URL: "http://localhost:3000/", VITE_USE_MOCK: "false" })).toEqual({
      VITE_API_URL: "http://localhost:3000",
      VITE_USE_MOCK: false,
    });
  });

  it("throws a clear error when a variable is missing", () => {
    expect(() => parseEnv({ VITE_USE_MOCK: "true" })).toThrow(/VITE_API_URL is required/);
  });

  it("rejects a value that is neither a path nor a URL", () => {
    expect(() => parseEnv({ VITE_API_URL: "api", VITE_USE_MOCK: "true" })).toThrow(
      /must be a path/,
    );
  });

  it('rejects VITE_USE_MOCK values other than "true" or "false"', () => {
    expect(() => parseEnv({ VITE_API_URL: "/api", VITE_USE_MOCK: "yes" })).toThrow(
      /VITE_USE_MOCK must be/,
    );
  });
});

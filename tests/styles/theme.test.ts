import themeCss from "@/styles/theme.css?raw";

function readColorTokens(css: string): Map<string, string> {
  const tokens = new Map<string, string>();
  for (const match of css.matchAll(/--color-([\w-]+):\s*(#[0-9a-f]{6})\s*;/gi)) {
    const [, name, hex] = match;
    if (name && hex) tokens.set(name, hex);
  }
  return tokens;
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((start) => {
    const channel = parseInt(hex.slice(start, start + 2), 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(hexA: string, hexB: string): number {
  const [lighter, darker] = [relativeLuminance(hexA), relativeLuminance(hexB)].sort(
    (a, b) => b - a,
  );
  return (lighter! + 0.05) / (darker! + 0.05);
}

const tokens = readColorTokens(themeCss);

function token(name: string): string {
  const hex = tokens.get(name);
  if (!hex) throw new Error(`Colour token --color-${name} is missing from theme.css`);
  return hex;
}

const SURFACES = ["canvas", "surface", "surface-muted"];

const TEXT_PAIRS: [string, string, string][] = [
  ...SURFACES.flatMap((bg): [string, string, string][] => [
    ["fg", bg, "body text and headings"],
    ["fg-muted", bg, "hints, descriptions, dates"],
  ]),
  ["primary", "canvas", "links on the page"],
  ["primary", "surface", "links inside cards"],
  ["primary-hover", "surface", "hovered links inside cards"],
  ["primary", "primary-subtle", "selected filter, info alert"],
  ["on-primary", "primary", "primary button label"],
  ["on-primary", "primary-hover", "primary button label while hovered"],
  ["danger", "surface", "field error message"],
  ["danger", "danger-subtle", "Overdue badge, error alert"],
  ["on-danger", "danger", "danger button label"],
  ["on-danger", "danger-hover", "danger button label while hovered"],
  ["success", "surface", "success text"],
  ["success", "success-subtle", "success alert"],
  ["fg", "primary-subtle", "selected text (::selection)"],
];

const UI_PAIRS: [string, string, string][] = SURFACES.flatMap((bg): [string, string, string][] => [
  ["border-strong", bg, "input and checkbox outlines"],
  ["focus", bg, "keyboard focus ring"],
]);

describe("theme colour contrast (T-U13)", () => {
  it.each(TEXT_PAIRS)("text: %s on %s (%s) is at least 4.5:1", (fg, bg) => {
    expect(contrastRatio(token(fg), token(bg))).toBeGreaterThanOrEqual(4.5);
  });

  it.each(UI_PAIRS)("UI: %s on %s (%s) is at least 3:1", (fg, bg) => {
    expect(contrastRatio(token(fg), token(bg))).toBeGreaterThanOrEqual(3);
  });

  it("calculates the known black-on-white ratio of 21:1", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
  });
});

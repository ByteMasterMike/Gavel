export const DIFFICULTY: Record<number, string> = {
  1: "Novice",
  2: "Expert",
  3: "Master",
  4: "Master",
  5: "Master",
};

export function syntheticCaseRef(id: string, tier: number): string {
  const alnum = id.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const core = (alnum.slice(0, 4) || "CASE").padEnd(4, "X");
  const tierChar = tier <= 1 ? "A" : tier === 2 ? "E" : tier === 3 ? "M" : "K";
  return `#${core}-${tierChar}`;
}

export function truncateBrief(text: string, max = 240): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max).trim()}…`;
}

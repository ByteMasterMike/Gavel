import type { CaseDocument, Precedent } from "@prisma/client";

export interface StyleScoreInput {
  citedPrecedentIds: string[];
  hintsUsed: number;
  flaggedDocIds: string[];
  openedDocIds: string[];
  verdictFlips: number;
  startedAt: Date;
  submittedAt: Date;
  parTimeMinutes: number;
  documents: CaseDocument[];
  precedents: Precedent[];
}

export interface StyleParts {
  precedentRaw: number;
  objectionRaw: number;
  efficiencyRaw: number;
  speedRaw: number;
  precedentNorm: number;
  objectionNorm: number;
  efficiencyNorm: number;
  speedNorm: number;
  total: number;
}

function clampNorm(x: number): number {
  return Math.max(0, Math.min(10000, Math.round(x)));
}

/** Map raw points (roughly centered) into 0–10k */
function toNorm(raw: number, cap: number): number {
  const scaled = ((raw + cap * 0.25) / (cap * 1.25)) * 10000;
  return clampNorm(scaled);
}

export function computeStyleScore(input: StyleScoreInput): StyleParts {
  const { citedPrecedentIds, hintsUsed, flaggedDocIds, openedDocIds, documents, precedents } =
    input;

  const precedentById = new Map(precedents.map((p) => [p.id, p]));
  const docById = new Map(documents.map((d) => [d.id, d]));

  let precedentRaw = 0;
  for (const id of citedPrecedentIds) {
    const p = precedentById.get(id);
    if (!p) continue;
    if (p.isRelevant) {
      if (hintsUsed === 0) precedentRaw += 1000 * p.weightMultiplier;
      else if (hintsUsed === 1) precedentRaw += 600;
      else precedentRaw += 300;
    } else {
      precedentRaw -= 200;
    }
  }

  const critical = precedents.filter((p) => p.isRelevant && p.weightMultiplier >= 1.8);
  for (const c of critical) {
    if (!citedPrecedentIds.includes(c.id)) precedentRaw -= 400;
  }

  let objectionRaw = 0;
  for (const id of flaggedDocIds) {
    const d = docById.get(id);
    if (!d) continue;
    if (!d.isAdmissible) objectionRaw += 800;
    else objectionRaw -= 300;
  }
  for (const d of documents) {
    if (!d.isAdmissible && d.isMaterial && !flaggedDocIds.includes(d.id)) {
      objectionRaw -= 600;
    }
  }

  const materialIds = documents.filter((d) => d.isMaterial).map((d) => d.id);
  const minNecessary = Math.max(1, materialIds.length);
  const openedUnique = new Set(openedDocIds);
  const openedCount = Math.max(openedUnique.size, 1);
  const ratio = openedCount / minNecessary;

  let efficiencyRaw = 0;
  if (ratio <= 1.1) efficiencyRaw = 600;
  else if (ratio <= 1.5) efficiencyRaw = 300;
  else if (ratio <= 2) efficiencyRaw = 0;
  else efficiencyRaw = -200;

  const elapsedMin = (input.submittedAt.getTime() - input.startedAt.getTime()) / 60000;
  const par = Math.max(1, input.parTimeMinutes);

  let speedRaw = 0;
  if (elapsedMin <= par) speedRaw = 300;
  else if (elapsedMin <= par * 2) speedRaw = 100;
  else if (elapsedMin <= par * 3) speedRaw = 0;
  else speedRaw = -100;

  const precCap = 8000;
  const objCap = 4000;
  const effCap = 800;
  const spCap = 400;

  const precedentNorm = toNorm(precedentRaw, precCap);
  const objectionNorm = toNorm(objectionRaw, objCap);
  const efficiencyNorm = toNorm(efficiencyRaw, effCap);
  const speedNorm = toNorm(speedRaw, spCap);

  const total = Math.round(
    precedentNorm * 0.4 + objectionNorm * 0.3 + efficiencyNorm * 0.2 + speedNorm * 0.1,
  );

  return {
    precedentRaw,
    objectionRaw,
    efficiencyRaw,
    speedRaw,
    precedentNorm,
    objectionNorm,
    efficiencyNorm,
    speedNorm,
    total: clampNorm(total),
  };
}

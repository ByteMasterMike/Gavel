import type { Prisma } from "@prisma/client";

/** Coerce Prisma Json (string id arrays) to string[]. */
export function jsonToStringArray(value: Prisma.JsonValue | null | undefined): string[] {
  if (value == null) return [];
  if (Array.isArray(value) && value.every((x) => typeof x === "string")) {
    return value as string[];
  }
  return [];
}

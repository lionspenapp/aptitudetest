import { createHash } from "crypto";

export function buildMaterialCacheKey(
  profileId: string,
  unitId: string,
  questionCount: number,
  examFormat: string
): string {
  const raw = `${profileId}:${unitId}:${questionCount}:${examFormat}`;
  return createHash("sha256").update(raw).digest("hex");
}

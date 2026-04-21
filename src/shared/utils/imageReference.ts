function normalizeIndex(index: number): number {
  if (!Number.isInteger(index) || index < 0) {
    return 0;
  }
  return index;
}

function normalizeDescription(description: string): string {
  return description.trim();
}

export function imageReferenceToken(index: number, description = ""): string {
  const safeIndex = normalizeIndex(index);
  const normalizedDescription = normalizeDescription(description);
  if (normalizedDescription.length === 0) {
    return `![](${safeIndex})`;
  }
  return `![${normalizedDescription}](${safeIndex})`;
}

export function appendImageReferenceTokenAtIndex(
  value: string | null | undefined,
  index: number,
  description = "Image"
): string {
  const base = (value ?? "").trimEnd();
  const reference = imageReferenceToken(index, description);
  return base.length === 0 ? reference : `${base} ${reference}`;
}

export function appendImageReferenceToken(
  value: string | null | undefined,
  imageCount: number,
  description = "Image"
): string {
  const inferredIndex = normalizeIndex(imageCount - 1);
  return appendImageReferenceTokenAtIndex(value, inferredIndex, description);
}

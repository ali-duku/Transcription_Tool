export function imageReferenceToken(index: number, label = "Image"): string {
  const safeIndex = Number.isInteger(index) && index > 0 ? index : 1;
  return `![${label} ${safeIndex}](${safeIndex})`;
}

export function appendImageReferenceToken(
  value: string | null | undefined,
  imageCount: number,
  label = "Image"
): string {
  const base = (value ?? "").trimEnd();
  const reference = imageReferenceToken(imageCount, label);
  return base.length === 0 ? reference : `${base} ${reference}`;
}

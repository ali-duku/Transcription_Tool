export interface UidScopedEntity {
  uid: string;
}

export function generateStableUid(prefix = "uid"): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now()}_${random}`;
}

export function ensureUid<T extends Partial<UidScopedEntity>>(
  item: T,
  prefix = "uid"
): T & UidScopedEntity {
  if (item.uid && item.uid.trim().length > 0) {
    return item as T & UidScopedEntity;
  }
  return { ...item, uid: generateStableUid(prefix) } as T & UidScopedEntity;
}

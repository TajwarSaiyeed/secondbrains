import type { Id } from 'convex/_generated/dataModel'

/**
 * Safe type casting for string IDs to Convex Id<T> branded type.
 * Used when converting URL params or string IDs to Convex mutation/query parameters.
 *
 * Note: We suppress type errors here because we intentionally allow casting any string
 * to an Id<T>. This is only safe when the caller ensures the ID value is actually valid.
 */
export function asId<T extends any = any>(
  id: string | undefined,
  // @ts-ignore - Allow generic T to be any string for flexible ID casting
): Id<T> | undefined {
  if (!id) return undefined
  // @ts-ignore - Allow generic T to be any string for flexible ID casting
  return id as unknown as Id<T>
}

/**
 * Force cast a string to Id<T> - use when you're certain the value is a valid Convex ID.
 *
 * Note: We suppress type errors here because we intentionally allow casting any string
 * to an Id<T>. This is only safe when the caller ensures the ID value is actually valid.
 */
export function forceAsId<T extends any = any>(id: string): any {
  // @ts-ignore - Allow generic T to be any string for flexible ID casting
  return id as unknown as Id<T>
}

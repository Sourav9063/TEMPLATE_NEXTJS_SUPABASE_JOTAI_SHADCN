type SortOrder = "asc" | "desc";

/**
 * Sorts an array of objects by a specified key.
 * The sorting can be done in ascending or descending order.
 * It can handle sorting by date strings (by converting them to timestamps)
 * or by any other value that can be compared with < and > operators.
 *
 * @template T - The type of objects in the array.
 * @param {T[]} data - The array of objects to sort.
 * @param {keyof T} key - The key to sort the objects by.
 * @param {SortOrder} [order='desc'] - The order to sort in ('asc' or 'desc').
 * @returns {T[]} A new array with the sorted objects.
 */
export function sortArray<T extends { updated_at: string | Date }>(
  data: T[],
  key: keyof T = "updated_at",
  order: SortOrder = "desc",
): T[] {
  return [...data].sort((a, b) => {
    const aValue = a[key];
    const bValue = b[key];

    // Handle date strings by converting to timestamp
    if (typeof aValue === "string" && typeof bValue === "string") {
      const aDate = new Date(aValue).getTime();
      const bDate = new Date(bValue).getTime();
      if (!Number.isNaN(aDate) && !Number.isNaN(bDate)) {
        return order === "desc" ? bDate - aDate : aDate - bDate;
      }
    }

    // Generic comparison for other types
    if (aValue < bValue) {
      return order === "asc" ? -1 : 1;
    }
    if (aValue > bValue) {
      return order === "asc" ? 1 : -1;
    }
    return 0;
  });
}

export const getObjectValues = (obj: unknown): unknown[] => {
  if (typeof obj !== "object" || obj === null) {
    return [];
  }

  const traversableObj = obj as Record<string, unknown>;

  const values: unknown[] = [];
  for (const key in traversableObj) {
    if (Object.hasOwn(traversableObj, key)) {
      const value = traversableObj[key];

      if (typeof value === "object" && value !== null) {
        values.push(...getObjectValues(value));
      } else {
        values.push(value);
      }
    }
  }
  return values;
};

export const numberArray = (length: number): number[] => {
  return [...Array(length).keys()];
};

export function snakeToCamelCase(str: string): string {
  return str.replace(/([-_][a-z])/gi, ($1) => {
    return $1.toUpperCase().replace("-", "").replace("_", "");
  });
}

export function keysToCamel<T = unknown>(obj: unknown): T {
  if (typeof obj !== "object" || obj === null) {
    return obj as T;
  }

  if (obj instanceof Date) {
    return obj as unknown as T;
  }

  if (Array.isArray(obj)) {
    return obj.map((v) => keysToCamel(v)) as unknown as T;
  }

  return Object.keys(obj).reduce(
    (result, key) => {
      const camelKey = snakeToCamelCase(key);
      result[camelKey as keyof typeof result] = keysToCamel(
        (obj as Record<string, unknown>)[key],
      );
      return result;
    },
    {} as Record<string, unknown>,
  ) as T;
}

export function camelToSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

export function keysToSnake<T = unknown>(obj: unknown): T {
  if (typeof obj !== "object" || obj === null) {
    return obj as T;
  }

  if (Array.isArray(obj)) {
    return obj.map((v) => keysToSnake(v)) as unknown as T;
  }

  return Object.keys(obj).reduce(
    (result, key) => {
      const snakeKey = camelToSnakeCase(key);
      result[snakeKey as keyof typeof result] = keysToSnake(
        (obj as Record<string, unknown>)[key],
      );
      return result;
    },
    {} as Record<string, unknown>,
  ) as T;
}

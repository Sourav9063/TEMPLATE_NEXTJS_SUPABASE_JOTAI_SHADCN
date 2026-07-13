/**
 * A generic memoization utility that uses a Map to cache function results.
 *
 * @param fn The function to memoize.
 * @param getKey A function to derive a cache key from the arguments.
 * @returns A memoized version of the function.
 */
export function memoize<K, V, Args extends unknown[]>(
  fn: (...args: Args) => V,
  getKey: (...args: Args) => K,
): (...args: Args) => V {
  const cache = new Map<K, V>();

  return (...args: Args): V => {
    const key = getKey(...args);
    if (cache.has(key)) {
      return cache.get(key) as V;
    }

    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}

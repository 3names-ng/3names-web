// @react-native-async-storage/async-storage backed by window.localStorage
// (in-memory during server rendering or when storage is blocked).
const mem = new Map<string, string>();

function ls(): Storage | null {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}

const get = (k: string): string | null => {
  const s = ls();
  return s ? s.getItem(k) : mem.get(k) ?? null;
};
const set = (k: string, v: string) => {
  const s = ls();
  if (s) s.setItem(k, v);
  else mem.set(k, v);
};
const del = (k: string) => {
  const s = ls();
  if (s) s.removeItem(k);
  else mem.delete(k);
};
const keys = (): string[] => {
  const s = ls();
  if (!s) return [...mem.keys()];
  const out: string[] = [];
  for (let i = 0; i < s.length; i++) {
    const k = s.key(i);
    if (k != null) out.push(k);
  }
  return out;
};

function merge(prev: string | null, next: string): string {
  try {
    return JSON.stringify({ ...(prev ? JSON.parse(prev) : {}), ...JSON.parse(next) });
  } catch {
    return next;
  }
}

const AsyncStorage = {
  getItem: async (key: string) => get(key),
  setItem: async (key: string, value: string) => set(key, value),
  removeItem: async (key: string) => del(key),
  mergeItem: async (key: string, value: string) => set(key, merge(get(key), value)),
  clear: async () => {
    const s = ls();
    if (s) s.clear();
    else mem.clear();
  },
  getAllKeys: async () => keys(),
  multiGet: async (ks: readonly string[]) =>
    ks.map((k) => [k, get(k)] as [string, string | null]),
  multiSet: async (pairs: ReadonlyArray<readonly [string, string]>) =>
    pairs.forEach(([k, v]) => set(k, v)),
  multiRemove: async (ks: readonly string[]) => ks.forEach(del),
  multiMerge: async (pairs: ReadonlyArray<readonly [string, string]>) =>
    pairs.forEach(([k, v]) => set(k, merge(get(k), v))),
};

export default AsyncStorage;

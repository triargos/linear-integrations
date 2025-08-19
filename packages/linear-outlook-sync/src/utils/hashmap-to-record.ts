import { HashMap } from 'effect';

export const hashMapToRecord = <TKey extends string | number | symbol, TValue>(
  hashMap: HashMap.HashMap<TKey, TValue>
): Record<TKey, TValue> => {
  return HashMap.toEntries(hashMap).reduce(
    (rec, entry) => {
      const [key, value] = entry;
      rec[key] = value;
      return rec;
    },
    {} as Record<TKey, TValue>
  );
};

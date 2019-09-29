import { useState, useEffect } from "react";

const x = <T = any>(fn: () => T): T => {
  try {
    return fn();
  } catch (ex) {
    console.error(ex);
  }
}

const noop = (...a: any) => { };
export const storage: Storage = 'window' in global
  ? window.localStorage
  : {
    clear: noop,
    getItem: noop,
    key: noop,
    length: NaN,
    removeItem: noop,
    setItem: noop,
  } as Storage;

export const useStateStorage = <T = any>(key: string, initialValue?: T, parse: (s: any) => T = (v) => x(() => JSON.parse(v))) => {
  const [val, setv] = useState<T>(initialValue);

  useEffect(() => {
    const valueStorage = storage.getItem(key);
    if (valueStorage) {
      const valueNext = parse(valueStorage);

      if (valueNext !== val) {
        setv(valueNext);
      }
    }
  }, []);

  const set = (v: any) => {
    const nextVal: T = typeof v === 'function' ? v(val) : v;
    setv(nextVal);
    process.nextTick(() => {
      storage.setItem(key, JSON.stringify(nextVal));
    });
  }

  return [val, set] as [typeof val, typeof setv];
};

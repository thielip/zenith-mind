type CookieValue = { value: string };

export function createCookieJar(initial: Record<string, string> = {}): any {
  const store = new Map<string, string>(Object.entries(initial));
  return {
    get: jest.fn((name: string): CookieValue | undefined => {
      const value = store.get(name);
      return value ? { value } : undefined;
    }),
    set: jest.fn((name: string, value: string) => {
      store.set(name, value);
    }),
    delete: jest.fn((name: string) => {
      store.delete(name);
    }),
    all: store,
  };
}

export function createHeaders(values: Record<string, string> = {}): any {
  const normalized = new Map(
    Object.entries(values).map(([key, value]) => [key.toLowerCase(), value])
  );
  return {
    get: jest.fn((name: string) => normalized.get(name.toLowerCase()) ?? null),
  };
}

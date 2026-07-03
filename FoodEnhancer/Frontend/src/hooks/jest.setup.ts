// Jest setup file for testing environment
declare global {
  namespace jest {
    interface Matchers<R> {
      toBe(expected: any): R;
    }
  }

  const describe: (name: string, fn: () => void) => void;
  const it: (name: string, fn: () => void | Promise<void>) => void;
  const beforeEach: (fn: () => void | Promise<void>) => void;
  const expect: (actual: any) => any;
  const jest: any;
}

export {};

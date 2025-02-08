declare module 'zustand' {
  import { StateCreator } from 'zustand/vanilla';

  export declare const create: <T>(
    initializer: StateCreator<T, [], []>
  ) => {
    (): T;
    <U>(selector: (state: T) => U): U;
  };
}

declare module 'zustand/vanilla' {
  export interface StateCreator<T> {
    (set: (partial: T | Partial<T> | ((state: T) => T | Partial<T>), replace?: boolean) => void, get: () => T): T;
  }
}
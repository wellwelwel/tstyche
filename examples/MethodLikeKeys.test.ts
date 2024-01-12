import { expect, test } from "tstyche";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MethodLike = (...args: any) => any;

type MethodLikeKeys<T> = keyof {
  [K in keyof T as Required<T>[K] extends MethodLike ? K : never]: T[K];
};

interface Sample {
  description: string;
  getLength: () => number;
  getWidth?: () => number;
}

test("is equal?", () => {
  expect<MethodLikeKeys<Sample>>().type.toEqual<"getLength" | "getWidth">();
});
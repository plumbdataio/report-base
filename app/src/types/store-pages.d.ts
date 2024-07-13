declare type BSelectOptionObject<T = void> = {
  value: string;
  text: string;
  disabled?: boolean;
  // [otherKey: string]: any;
} & (T extends string ? {[key in T]?: any} : {})
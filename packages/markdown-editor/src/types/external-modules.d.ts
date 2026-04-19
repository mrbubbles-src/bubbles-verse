declare module '*.png' {
  const value: {
    src: string;
    height: number;
    width: number;
    blurDataURL?: string;
    blurHeight?: number;
    blurWidth?: number;
  };

  export default value;
}

declare module 'node:buffer' {
  export const Buffer: {
    from(input: ArrayBuffer | ArrayBufferView | string): {
      toString(encoding?: string): string;
    };
  };
}

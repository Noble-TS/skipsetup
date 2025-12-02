export interface WriteFileOptions {
  append?: boolean;
}
export declare function writeFile(
  fullPathOrDir: string,
  contentOrFilename: string,
  contentOrOptions?: string | WriteFileOptions,
  options?: WriteFileOptions
): Promise<void>;
//# sourceMappingURL=file.d.ts.map

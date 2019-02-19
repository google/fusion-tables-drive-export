/**
 * A table
 */
export type ICsv = {
  readonly name: string;
  readonly filename: string;
  readonly data: string;
  readonly hasLargeCells?: boolean;
};

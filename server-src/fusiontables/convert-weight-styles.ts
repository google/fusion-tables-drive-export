import {fusiontables_v2} from 'googleapis';
import {IWeightStyle} from '../interfaces/style';

/**
 * Convert the weight styles for a visualization
 */
export default function convertWeightStyles(
  weight?: number,
  weightStyler?: fusiontables_v2.Schema$StyleFunction
): IWeightStyle {
  if (weightStyler && weightStyler.kind === 'fusiontables#fromColumn') {
    return {
      columnName: weightStyler.columnName
    };
  } else if (
    weightStyler &&
    weightStyler.kind === 'fusiontables#buckets' &&
    weightStyler.buckets
  ) {
    return {
      columnName: weightStyler.columnName,
      buckets: weightStyler.buckets.map(bucket => ({
        min: bucket.min || 0,
        max: bucket.max || 0,
        weight: bucket.weight || 1
      }))
    };
  }

  return {weight};
}

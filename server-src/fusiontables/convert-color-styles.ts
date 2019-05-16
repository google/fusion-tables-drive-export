import {fusiontables_v2} from 'googleapis';
import {IColorStyle} from '../interfaces/style';
import getColorWithAlpha from '../lib/get-color-with-alpha';

/**
 * Convert the color styles for a visualization
 */
export default function convertColorStyles(
  color?: string,
  opacity?: number,
  colorStyler?: fusiontables_v2.Schema$StyleFunction
): IColorStyle {
  if (colorStyler && colorStyler.kind === 'fusiontables#fromColumn') {
    return {
      columnName: colorStyler.columnName
    };
  } else if (
    colorStyler &&
    colorStyler.kind === 'fusiontables#buckets' &&
    colorStyler.buckets
  ) {
    return {
      columnName: colorStyler.columnName,
      buckets: colorStyler.buckets.map(bucket => ({
        min: bucket.min || 0,
        max: bucket.max || 0,
        color: getColorWithAlpha(bucket.color || '', bucket.opacity)
      }))
    };
  } else if (
    colorStyler &&
    colorStyler.kind === 'fusiontables#gradient' &&
    colorStyler.gradient
  ) {
    const colors = colorStyler.gradient.colors || [];
    return {
      columnName: colorStyler.columnName,
      gradient: {
        min: colorStyler.gradient.min || 0,
        max: colorStyler.gradient.max || 0,
        colors: colors.map(rawColor =>
          getColorWithAlpha(rawColor.color || '', rawColor.opacity)
        )
      }
    };
  }

  return {
    color: getColorWithAlpha(color || '#ff0000', opacity)
  };
}

import {fusiontables_v2} from 'googleapis';
import {IMarkerStyle} from '../interfaces/style';

/**
 * Convert the marker style for the visualization
 */
export default function convertMarkerStyles(
  markerOptions: fusiontables_v2.Schema$PointStyle
): IMarkerStyle {
  const {iconName, iconStyler} = markerOptions;
  const markerStyle: IMarkerStyle = {};

  if (iconName) {
    markerStyle.icon = iconName;
  } else if (
    iconStyler &&
    iconStyler.kind === 'fusiontables#buckets' &&
    iconStyler.buckets
  ) {
    markerStyle.columnName = iconStyler.columnName;
    markerStyle.buckets = iconStyler.buckets.map(bucket => ({
      min: bucket.min || 0,
      max: bucket.max || 0,
      icon: bucket.icon || ''
    }));
  }

  return markerStyle;
}

import {fusiontables_v2} from 'googleapis';
import {IMarkerStyle, IMarkerIcon} from '../interfaces/style';
import getColorFromIconName from '../lib/get-color-from-icon-name';

/**
 * Convert the marker style for the visualization
 */
export default function convertMarkerStyles(
  markerOptions: fusiontables_v2.Schema$PointStyle
): IMarkerStyle {
  const {iconName, iconStyler} = markerOptions;
  const markerStyle: IMarkerStyle = {};

  if (iconName) {
    markerStyle.icon = getIconFromName(iconName);
  } else if (
    iconStyler &&
    iconStyler.kind === 'fusiontables#buckets' &&
    iconStyler.buckets
  ) {
    markerStyle.columnName = iconStyler.columnName;
    markerStyle.buckets = iconStyler.buckets.map(bucket => ({
      min: bucket.min || 0,
      max: bucket.max || 0,
      icon: getIconFromName(bucket.icon || '')
    }));
  }

  return markerStyle;
}

/**
 * Get the icon definition from an icon name
 */
function getIconFromName(iconName: string): IMarkerIcon {
  return {
    fillColor: getColorFromIconName(iconName),
    size: iconName.startsWith('large') ? 'large' : 'small'
  };
}

import {google, fusiontables_v2} from 'googleapis';
import {OAuth2Client} from 'google-auth-library';
import {IStyle} from '../interfaces/style';
import getColorFromIconName from '../lib/get-color-from-icon-name';
import getColorWithAlpha from '../lib/get-color-with-alpha';

const fusiontables = google.fusiontables('v2');

/**
 * Get the tables for the authenticated user account
 */
export default async function(
  auth: OAuth2Client,
  tableId: string
): Promise<IStyle[]> {
  try {
    const {data} = await fusiontables.style.list({
      auth,
      tableId,
      maxResults: 1000
    });

    if (!data.items) {
      return [];
    }

    let fusiontableStyles = data.items;

    if (fusiontableStyles.length > 1) {
      fusiontableStyles = fusiontableStyles.filter(
        style => style.name !== 'Default style'
      );
    }

    const styles = fusiontableStyles.map(getStyle);

    return styles;
  } catch (error) {
    throw error;
  }
}

/**
 * Get the style from a Fusiontable Style setting
 */
function getStyle(
  fusiontableStyle: fusiontables_v2.Schema$StyleSetting
): IStyle {
  const {markerOptions, polylineOptions, polygonOptions} = fusiontableStyle;
  const style: IStyle = {};

  if (markerOptions && markerOptions.iconName) {
    style.marker = {
      fillColor: getColorFromIconName(markerOptions.iconName),
      size: markerOptions.iconName.startsWith('large') ? 'large' : 'small'
    };
  }

  if (polylineOptions) {
    const {strokeWeight, strokeColor, strokeOpacity} = polylineOptions;

    style.polyline = {strokeWeight};

    if (strokeColor) {
      style.polyline.strokeColor = getColorWithAlpha(
        strokeColor,
        strokeOpacity
      );
    }
  }

  if (polygonOptions) {
    const {
      strokeWeight,
      strokeColor,
      strokeOpacity,
      fillColor,
      fillOpacity
    } = polygonOptions;

    style.polygon = {strokeWeight};

    if (strokeColor) {
      style.polygon.strokeColor = getColorWithAlpha(strokeColor, strokeOpacity);
    }

    if (fillColor) {
      style.polygon.fillColor = getColorWithAlpha(fillColor, fillOpacity);
    }
  }

  return style;
}

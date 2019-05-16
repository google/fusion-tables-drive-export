import {google, fusiontables_v2} from 'googleapis';
import {OAuth2Client} from 'google-auth-library';
import {IStyle} from '../interfaces/style';
import convertMarkerStyles from './convert-marker-styles';
import convertColorStyles from './convert-color-styles';
import convertWeightStyles from './convert-weight-styles';

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

  if (markerOptions) {
    style.marker = convertMarkerStyles(markerOptions);
  }

  if (polylineOptions) {
    style.polyline = {
      strokeColor: convertColorStyles(
        polylineOptions.strokeColor,
        polylineOptions.strokeOpacity,
        polylineOptions.strokeColorStyler
      ),
      strokeWeight: convertWeightStyles(
        polylineOptions.strokeWeight,
        polylineOptions.strokeWeightStyler
      )
    };
  }

  if (polygonOptions) {
    style.polygon = {
      fill: convertColorStyles(
        polygonOptions.fillColor,
        polygonOptions.fillOpacity,
        polygonOptions.fillColorStyler
      ),
      strokeColor: convertColorStyles(
        polygonOptions.strokeColor,
        polygonOptions.strokeOpacity,
        polygonOptions.strokeColorStyler
      ),
      strokeWeight: convertWeightStyles(
        polygonOptions.strokeWeight,
        polygonOptions.strokeWeightStyler
      )
    };
  }

  return style;
}

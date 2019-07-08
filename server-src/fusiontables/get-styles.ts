/*!
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {google, fusiontables_v2} from 'googleapis';
import {OAuth2Client} from 'google-auth-library';
import promiseRetry from 'promise-retry';
import {IStyle} from '../interfaces/style';
import convertMarkerStyles from './convert-marker-styles';
import convertColorStyles from './convert-color-styles';
import convertWeightStyles from './convert-weight-styles';
import {RETRY_OPTIONS} from '../config/config';

const fusiontables = google.fusiontables('v2');

/**
 * Wrapper around the actual function with exponential retries
 */
export default function getFusiontableStyles(
  auth: OAuth2Client,
  tableId: string
): Promise<IStyle[]> {
  return promiseRetry(
    retry => getFusiontableStylesWorker(auth, tableId).catch(retry),
    RETRY_OPTIONS
  );
}

/**
 * Get the tables for the authenticated user account
 */
async function getFusiontableStylesWorker(
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

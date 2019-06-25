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
  } else if (iconStyler && iconStyler.kind === 'fusiontables#fromColumn') {
    markerStyle.columnName = iconStyler.columnName;
  }

  return markerStyle;
}

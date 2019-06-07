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

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

/**
 * Parse the data for geometries or point data
 */
export default function(data: string[][]): boolean {
  const columnNames = data[0];

  if (columnNames.includes('geometry')) {
    return true;
  }

  const hasLatLngColumns =
    hasColumnStartingWith(columnNames, 'lat') &&
    (hasColumnStartingWith(columnNames, 'lng') ||
      hasColumnStartingWith(columnNames, 'lon'));

  if (hasLatLngColumns) {
    return true;
  }

  return false;
}

/**
 * Check whether there is a column name starting with the passed string
 */
function hasColumnStartingWith(columnNames: string[], start: string): boolean {
  return columnNames.some(columnName =>
    columnName.toLowerCase().startsWith(start)
  );
}

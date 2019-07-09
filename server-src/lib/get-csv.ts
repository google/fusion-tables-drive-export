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

import Papa from 'papaparse';
import {OAuth2Client} from 'google-auth-library';
import {ITable} from '../interfaces/table';
import {ICsv} from '../interfaces/csv';
import getFusiontableCsv from '../fusiontables/get-csv';
import getFusiontableColumns from '../fusiontables/get-columns';
import convertKmlToGeoJson from './convert-kml-to-geojson';
import checkForLargeCells from './check-for-large-cells';
import getHasGeometryData from './get-has-geometry-data';

/**
 * Get the CSV to upload to Drive
 */
export default async function(
  auth: OAuth2Client,
  table: ITable
): Promise<ICsv> {
  const [csv, columns] = await Promise.all([
    getFusiontableCsv(auth, table),
    getFusiontableColumns(auth, table.id)
  ]);
  const json = Papa.parse(csv.data).data;
  const jsonWithColumnTypes = addColumnTypes(json, columns);
  const jsonWithGeoJson = convertKmlToGeoJson(jsonWithColumnTypes);
  const hasLargeCells = checkForLargeCells(jsonWithGeoJson);
  const hasGeometryData = getHasGeometryData(jsonWithGeoJson);

  return Object.assign({}, csv, {
    data: Papa.unparse(jsonWithGeoJson),
    hasLargeCells,
    hasGeometryData
  });
}

/**
 * Add the type for some columns
 */
function addColumnTypes(
  json: any[],
  columns: Array<{
    name: string;
    isImage: boolean;
  }>
): any[] {
  const titleRow = json[0].map((columnName: string) => {
    const matchingColumn = columns.find(column => column.name === columnName);

    if (matchingColumn && matchingColumn.isImage) {
      return columnName + ' ::image';
    }

    return columnName;
  });

  json[0] = titleRow;

  return json;
}

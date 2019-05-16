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
  const csv = await getFusiontableCsv(auth, table);
  const json = Papa.parse(csv.data).data;
  const columns = await getFusiontableColumns(auth, table.id);
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

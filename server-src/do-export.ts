/// <reference path="./interfaces/togeojson.d.ts" />
import pLimit from 'p-limit';
import Papa from 'papaparse';
import {DOMParser} from 'xmldom';
import {kml as kml2GeoJson} from '@tmcw/togeojson';
import {OAuth2Client} from 'google-auth-library';
import {ITable} from './interfaces/table';
import {ICsv} from './interfaces/csv';
import {ISheet} from './interfaces/sheet';
import getFusiontableCsv from './fusiontables/get-csv';
import getDriveUploadFolder from './drive/get-upload-folder';
import transferFilePermissions from './drive/transfer-file-permissions';
import uploadToDrive from './drive/upload';
import getArchiveIndexSheet from './drive/get-archive-index-sheet';
import insertExportRowInIndexSheet from './drive/insert-export-row-in-index-sheet';
import logFileExportInIndexSheet from './drive/log-file-export-in-index-sheet';

const DRIVE_CELL_LIMIT = 50000;

/**
 * Export a table from FusionTables and save it to Drive
 */
export default function(
  auth: OAuth2Client,
  emitter: mitt.Emitter,
  tables: ITable[],
  origin: string
): Promise<void> {
  return new Promise(async (resolve, reject) => {
    const limit = pLimit(1);
    const folderId = await getDriveUploadFolder(auth);
    const archiveSheet = await getArchiveIndexSheet(auth);
    await insertExportRowInIndexSheet(auth, archiveSheet, folderId);

    Promise.all(
      tables.map(table =>
        limit(() =>
          saveTable({table, emitter, auth, folderId, archiveSheet, origin})
        )
      )
    )
      .then(() => resolve())
      .catch(reject);
  });
}

/**
 * Save a table from FusionTables to Drive
 */
interface ISaveTableOptions {
  table: ITable;
  emitter: mitt.Emitter;
  auth: OAuth2Client;
  folderId: string;
  archiveSheet: ISheet;
  origin: string;
}
async function saveTable(options: ISaveTableOptions): Promise<ICsv> {
  const {table, auth, emitter, folderId, archiveSheet, origin} = options;
  console.log(`###### Starting to save ${table.name}.`);

  const csv = await getFusiontableCsv(auth, table);
  const csvWithGeoJson = convertKmlToGeoJson(csv);
  const driveFile = await uploadToDrive(auth, folderId, csvWithGeoJson);
  await logFileExportInIndexSheet(auth, origin, archiveSheet, table, driveFile);
  await transferFilePermissions(auth, table.id, driveFile.id as string);

  emitter.emit('table-finished', {
    table,
    driveFile,
    credentials: auth.credentials
  });

  console.log(`###### Saved! Drive ID for ${driveFile.name}: ${driveFile.id}`);
  return csv;
}

/**
 * Convert all Geo things to WKT
 */
function convertKmlToGeoJson(csv: ICsv): ICsv {
  const json = Papa.parse(csv.data).data;
  let hasLargeCells = false;

  const jsonWithGeoJson = json
    .filter(row => row)
    .map(row => {
      return row.map((cell: any) => {
        if (cell.length >= DRIVE_CELL_LIMIT) {
          hasLargeCells = true;
        }

        try {
          const geoJson = convertToGeoJson(cell);
          return geoJson || cell;
        } catch (error) {
          return cell;
        }
      });
    });

  return Object.assign({}, csv, {
    data: Papa.unparse(jsonWithGeoJson),
    hasLargeCells
  });
}

/**
 * Convert a value to GeoJSON or return null if not possible
 */
function convertToGeoJson(
  value: any
): string | null {
  if (value.startsWith && !value.startsWith('<')) {
    return null;
  }

  const kmlString = `<?xml version="1.0" encoding="UTF-8"?>
    <kml xmlns="http://www.opengis.net/kml/2.2">
      <Placemark>
        ${value}
      </Placemark>
    </kml>`;

  const kmlDom = new DOMParser().parseFromString(kmlString, 'text/xml');
  const geoJson = kml2GeoJson(kmlDom);

  if (!geoJson.features || geoJson.features.length === 0) {
    return null;
  }

  return JSON.stringify(geoJson.features[0]);
}

/// <reference path="./interfaces/togeojson.d.ts" />
import {drive_v3} from 'googleapis';
import pLimit from 'p-limit';
import Papa from 'papaparse';
import {DOMParser} from 'xmldom';
import {kml as kml2GeoJson} from '@tmcw/togeojson';
import {OAuth2Client} from 'google-auth-library';
import {ErrorReporting} from '@google-cloud/error-reporting';
import {ITable} from './interfaces/table';
import {ICsv} from './interfaces/csv';
import {ISheet} from './interfaces/sheet';
import ExportLog from './export-log';
import getArchiveFolder from './drive/get-archive-folder';
import getFusiontableCsv from './fusiontables/get-csv';
import getDriveUploadFolder from './drive/get-upload-folder';
import uploadToDrive from './drive/upload';
import getArchiveIndexSheet from './drive/get-archive-index-sheet';
import insertExportRowInIndexSheet from './drive/insert-export-row-in-index-sheet';
import logFileExportInIndexSheet from './drive/log-file-export-in-index-sheet';
import addFilePermissions from './drive/add-file-permissions';
import {web as serverCredentials} from './credentials.json';
import credentials from './credentials-error-reporting.json';

const DRIVE_CELL_LIMIT = 50000;
const errors = new ErrorReporting({
  reportUnhandledRejections: true,
  projectId: serverCredentials.project_id,
  credentials
});

/**
 * Export a table from FusionTables and save it to Drive
 */
interface IDoExportOptions {
  auth: OAuth2Client;
  exportLog: ExportLog;
  exportId: string;
  tables: ITable[];
  origin: string;
}
export default async function(options: IDoExportOptions): Promise<string> {
  const {auth, exportLog, exportId, tables, origin} = options;
  const limit = pLimit(1);
  let folderId: string;
  let archiveSheet: ISheet;

  try {
    const archiveFolderId = await getArchiveFolder(auth);
    folderId = await getDriveUploadFolder(auth, archiveFolderId);
    archiveSheet = await getArchiveIndexSheet(auth, archiveFolderId);
    await insertExportRowInIndexSheet(auth, archiveSheet, folderId);
  } catch (error) {
    throw error;
  }

  tables.map(table =>
    limit(() =>
      saveTable({
        table,
        auth,
        folderId,
        archiveSheet,
        origin,
        exportLog,
        exportId
      })
    )
  );

  return folderId;
}

/**
 * Save a table from FusionTables to Drive
 */
interface ISaveTableOptions {
  table: ITable;
  auth: OAuth2Client;
  folderId: string;
  archiveSheet: ISheet;
  origin: string;
  exportLog: ExportLog;
  exportId: string;
}
async function saveTable(options: ISaveTableOptions): Promise<void> {
  const {
    table,
    auth,
    folderId,
    archiveSheet,
    origin,
    exportLog,
    exportId
  } = options;
  let driveFile: drive_v3.Schema$File | undefined;

  try {
    const csv = await getFusiontableCsv(auth, table);
    const csvWithGeoJson = convertKmlToGeoJson(csv);
    driveFile = await uploadToDrive(auth, folderId, csvWithGeoJson);
    await logFileExportInIndexSheet(
      auth,
      origin,
      archiveSheet,
      table,
      driveFile
      );
    await addFilePermissions(auth, driveFile.id as string, table.permissions);

    exportLog.logSuccess(exportId, table.id, driveFile);
  } catch (error) {
    errors.report(error);
    exportLog.logError(exportId, table.id, error.message, driveFile);
  }
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
function convertToGeoJson(value: any): string | null {
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

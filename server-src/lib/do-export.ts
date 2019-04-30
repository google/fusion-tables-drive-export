/// <reference path="../interfaces/togeojson.d.ts" />
import {drive_v3} from 'googleapis';
import pLimit from 'p-limit';
import {OAuth2Client} from 'google-auth-library';
import {ErrorReporting} from '@google-cloud/error-reporting';
import {ITable} from '../interfaces/table';
import {ISheet} from '../interfaces/sheet';
import ExportLog from './export-log';
import convertKmlToGeoJson from './convert-kml-to-geojson';
import getArchiveFolder from '../drive/get-archive-folder';
import getFusiontableCsv from '../fusiontables/get-csv';
import getDriveUploadFolder from '../drive/get-upload-folder';
import uploadToDrive from '../drive/upload';
import getArchiveIndexSheet from '../drive/get-archive-index-sheet';
import insertExportRowInIndexSheet from '../drive/insert-export-row-in-index-sheet';
import logFileExportInIndexSheet from '../drive/log-file-export-in-index-sheet';
import addFilePermissions from '../drive/add-file-permissions';
import {web as serverCredentials} from '../config/credentials.json';
import credentials from '../config/credentials-error-reporting.json';

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
  let hasGeometryData: boolean = false;
  let driveFile: drive_v3.Schema$File | undefined;

  try {
    const csv = await getFusiontableCsv(auth, table);
    const csvWithGeoJson = convertKmlToGeoJson(csv);
    hasGeometryData = csvWithGeoJson.hasGeometryData || false;
    driveFile = await uploadToDrive(auth, folderId, csvWithGeoJson);
    await addFilePermissions(auth, driveFile.id as string, table.permissions);
    await logFileExportInIndexSheet({
      auth,
      origin,
      sheet: archiveSheet,
      table,
      driveFile,
      hasGeometryData
    });

    exportLog.logTable({
      exportId,
      tableId: table.id,
      status: 'success',
      driveFile,
      hasGeometryData
    });
  } catch (error) {
    errors.report(error);
    exportLog.logTable({
      exportId,
      tableId: table.id,
      status: 'error',
      error: error.message,
      driveFile,
      hasGeometryData
    });
  }
}

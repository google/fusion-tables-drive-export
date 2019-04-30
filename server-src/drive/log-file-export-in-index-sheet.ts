import {google, drive_v3, sheets_v4} from 'googleapis';
import {OAuth2Client} from 'google-auth-library';
import {ISheet} from '../interfaces/sheet';
import {ITable} from '../interfaces/table';
import {MIME_TYPES} from '../config/config';

const sheets = google.sheets('v4');

/**
 * Log an exported file in the index sheet
 */
interface ILogFileOptions {
  auth: OAuth2Client;
  origin: string;
  sheet: ISheet;
  table: ITable;
  driveFile: drive_v3.Schema$File;
}
export default async function(options: ILogFileOptions): Promise<void> {
  const {auth, origin, sheet, table, driveFile, hasGeometryData} = options;
  const {spreadsheetId, sheetId} = sheet;
  const tableLink = `https://fusiontables.google.com/DataSource?docid=${
    table.id
  }`;
  const fileLink = `https://drive.google.com/open?id=${driveFile.id}`;
  const fileType =
    driveFile.mimeType === MIME_TYPES.csv ? 'CSV' : 'Spreadsheet';
  const visualizerLink = `${origin}/visualizer/#file=${driveFile.id}`;

  try {
    const response = await sheets.spreadsheets.batchUpdate({
      auth,
      spreadsheetId,
      requestBody: {
        requests: [
          {
            appendCells: {
              sheetId,
              rows: [
                {
                  values: [
                    {userEnteredValue: {stringValue: driveFile.name}},
                    {userEnteredValue: {stringValue: tableLink}},
                    {userEnteredValue: {stringValue: fileLink}},
                    {userEnteredValue: {stringValue: fileType}},
                    {userEnteredValue: {stringValue: visualizerLink}},
                    {userEnteredValue: {stringValue: new Date().toISOString()}}
                  ]
                }
              ],
              fields: 'userEnteredValue'
            }
          }
        ]
      }
    } as sheets_v4.Params$Resource$Spreadsheets$Batchupdate);

    if (response.statusText !== 'OK') {
      throw new Error(`Cannot log file export: ${response.statusText}`);
    }
  } catch (error) {
    throw error;
  }

  return;
}

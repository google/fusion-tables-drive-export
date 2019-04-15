import {google, drive_v3, sheets_v4} from 'googleapis';
import {OAuth2Client} from 'google-auth-library';
import {ISheet} from '../interfaces/sheet';
import {ITable} from '../interfaces/table';

const sheets = google.sheets('v4');

/**
 * Log an exported file in the index sheet
 */
export default async function(
  auth: OAuth2Client,
  sheet: ISheet,
  table: ITable,
  driveFile: drive_v3.Schema$File
): Promise<void> {
  const {spreadsheetId, sheetId} = sheet;
  const tableLink = `https://fusiontables.google.com/DataSource?docid=${
    table.id
  }`;
  const fileLink = `https://drive.google.com/open?id=${driveFile.id}`;
  const visualizerLink = `http://localhost:3000/visualizer/#file=${
    driveFile.id
  }`;

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
    throw new Error('Couldn’t write file to sheet');
  }

  return;
}

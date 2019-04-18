import {google, sheets_v4} from 'googleapis';
import {OAuth2Client} from 'google-auth-library';
import {ISheet} from '../interfaces/sheet';

const sheets = google.sheets('v4');

/**
 * Add a message for this export
 */
export default async function(
  auth: OAuth2Client,
  sheet: ISheet,
  folderId: string
): Promise<void> {
  const {spreadsheetId, sheetId} = sheet;
  const message =
    '=HYPERLINK(' +
    `"https://drive.google.com/drive/folders/${folderId}",` +
    '"Open Export folder")';

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
                    {
                      userEnteredValue: {stringValue: ''}
                    }
                  ]
                },
                {
                  values: [
                    {
                      userEnteredValue: {formulaValue: message},
                      userEnteredFormat: {textFormat: {bold: true}}
                    }
                  ]
                }
              ],
              fields: '*'
            }
          }
        ]
      }
    } as sheets_v4.Params$Resource$Spreadsheets$Batchupdate);

    if (response.statusText !== 'OK') {
      throw new Error(`Cannot log export folder: ${response.statusText}`);
    }
  } catch (error) {
    throw error;
  }

  return;
}

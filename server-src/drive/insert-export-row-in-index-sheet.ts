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

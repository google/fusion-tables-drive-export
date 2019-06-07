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

import {google} from 'googleapis';
import {OAuth2Client} from 'google-auth-library';
import {ITable} from '../interfaces/table';

const drive = google.drive('v3');

interface IGetTableFiles {
  nextPageToken?: string;
  tables: ITable[];
}

/**
 * Find all Fusiontables owned by user
 */
export default async function(
  auth: OAuth2Client,
  ids?: string[]
): Promise<ITable[]> {
  try {
    let allTables: ITable[] = [];
    let pageToken: string | undefined;

    do {
      const {tables, nextPageToken} = await getTableFiles(auth, pageToken);
      pageToken = nextPageToken;
      allTables = [...allTables, ...tables];
    } while (pageToken);

    if (ids) {
      allTables = allTables.filter(table => ids.includes(table.id as string));
    }

    return allTables;
  } catch (error) {
    throw error;
  }
}

/**
 * Get all Fusiontables owned by user
 */
async function getTableFiles(
  auth: OAuth2Client,
  nextPageToken?: string
): Promise<IGetTableFiles> {
  try {
    const response = await drive.files.list({
      auth,
      orderBy: 'name',
      pageSize: 1000,
      pageToken: nextPageToken,
      fields: 'nextPageToken,files(id,name,permissions)',
      q:
        // tslint:disable quotemark
        "'me' in owners and " +
        "mimeType = 'application/vnd.google-apps.fusiontable' and " +
        'trashed = false'
      // tslint:enable quotemark
    });

    return {
      nextPageToken: response.data.nextPageToken,
      tables: (response.data.files as ITable[]) || []
    };
  } catch (error) {
    throw error;
  }
}

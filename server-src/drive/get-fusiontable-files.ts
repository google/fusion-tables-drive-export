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
import {IGetTableFiles} from '../interfaces/tables-list';

const drive = google.drive('v3');

/**
 * Get the Fusiontables owned by user
 */
interface IGetFusiontableFiles {
  auth: OAuth2Client;
  limit: number;
  query?: string;
  pageToken?: string;
}
export default async function getFusiontableFiles(
  params: IGetFusiontableFiles
): Promise<IGetTableFiles> {
  const {auth, limit, query, pageToken} = params;

  try {
    const response = await drive.files.list({
      auth,
      orderBy: 'name',
      pageSize: limit,
      pageToken,
      fields: 'nextPageToken,files(id,name,permissions)',
      q:
        // tslint:disable quotemark
        (query ? `${query} and ` : '') +
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
    const tokenError =
      error.errors &&
      error.errors.find &&
      error.errors.find(
        (err: any) =>
          err.message === 'Invalid Value' && err.location === 'pageToken'
      );

    if (tokenError) {
      return getFusiontableFiles({auth, limit, query});
    }

    throw error;
  }
}

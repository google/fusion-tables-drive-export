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
import promiseRetry from 'promise-retry';
import {RETRY_OPTIONS} from '../config/config';

const fusiontables = google.fusiontables('v2');

/**
 * Wrapper around the actual function with exponential retries
 */
export default function getFusiontableColumns(
  auth: OAuth2Client,
  tableId: string
): Promise<Array<{name: string; isImage: boolean}>> {
  return promiseRetry(
    retry => getFusiontableColumnsWorker(auth, tableId).catch(retry),
    RETRY_OPTIONS
  );
}

/**
 * Get the tables for the authenticated user account
 */
async function getFusiontableColumnsWorker(
  auth: OAuth2Client,
  tableId: string
): Promise<Array<{name: string; isImage: boolean}>> {
  try {
    const {data} = await fusiontables.column.list({
      auth,
      tableId,
      maxResults: 1000
    });

    if (!data.items) {
      return [];
    }

    return data.items.map(column => ({
      name: column.name || '',
      isImage:
        column.formatPattern === 'STRING_EIGHT_LINE_IMAGE' ||
        column.formatPattern === 'STRING_FOUR_LINE_IMAGE' ||
        column.formatPattern === 'STRING_ONE_LINE_IMAGE'
    }));
  } catch (error) {
    throw error;
  }
}

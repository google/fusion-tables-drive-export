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

import fetch from 'node-fetch';
import {OAuth2Client} from 'google-auth-library';
import promiseRetry from 'promise-retry';
import {ITable} from '../interfaces/table';
import {ICsv} from '../interfaces/csv';
import {RETRY_OPTIONS} from '../config/config';

/**
 * Wrapper around the actual function with exponential retries
 */
export default function getFusiontableCsv(
  auth: OAuth2Client,
  table: ITable
): Promise<ICsv> {
  return promiseRetry(
    retry => getFusiontableCsvWorker(auth, table).catch(retry),
    RETRY_OPTIONS
  );
}

/**
 * Get the CSV export for a table
 */
async function getFusiontableCsvWorker(
  auth: OAuth2Client,
  table: ITable
): Promise<ICsv> {
  try {
    const {token} = await auth.getAccessToken();
    const query = `SELECT * FROM ${table.id}`;
    const url =
      'https://www.googleapis.com/fusiontables/v2/query' +
      `?sql=${encodeURIComponent(query)}&alt=media`;
    const options = {
      headers: {
        'Accept-Encoding': 'gzip',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`
      }
    };

    const response = await fetch(url, options);
    const csv = await response.text();

    return {
      name: table.name,
      filename: `${table.name}.csv`,
      data: csv
    };
  } catch (error) {
    throw error;
  }
}

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

import {OAuth2Client} from 'google-auth-library';
import promiseRetry from 'promise-retry';
import getFusiontableFiles from './get-fusiontable-files';
import {IGetTableFiles} from '../interfaces/tables-list';
import {TABLES_PER_PAGE, RETRY_OPTIONS} from '../config/config';

/**
 * Wrapper around the actual function with exponential retries
 */
export default function findFusiontables(
  auth: OAuth2Client,
  filterByName?: string,
  pageToken?: string
): Promise<IGetTableFiles> {
  return promiseRetry(
    retry => findFusiontablesWorker(auth, filterByName, pageToken).catch(retry),
    RETRY_OPTIONS
  );
}

/**
 * Find all Fusiontables owned by user
 */
async function findFusiontablesWorker(
  auth: OAuth2Client,
  filterByName?: string,
  pageToken?: string
): Promise<IGetTableFiles> {
  try {
    const query = filterByName ? `name contains '${filterByName}'` : undefined;
    return await getFusiontableFiles({
      auth,
      limit: TABLES_PER_PAGE,
      query,
      pageToken
    });
  } catch (error) {
    throw error;
  }
}

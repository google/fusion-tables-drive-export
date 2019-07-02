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
import getFusiontableFiles from './get-fusiontable-files';
import {IGetTableFiles} from '../interfaces/tables-list';
import {TABLES_PER_PAGE} from '../config/config';

/**
 * Find all Fusiontables owned by user
 */
export default async function(
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

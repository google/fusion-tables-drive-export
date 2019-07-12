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

import promiseRetry from 'promise-retry';
import datastore from './datastore';
import {Credentials} from 'google-auth-library';
import {RETRY_OPTIONS} from '../config/config';
import hashCredentials from '../lib/hash-credentials';

/**
 * Wrapper around the actual function with exponential retries
 */
export default function hasOtherExportsForSession(
  exportId: string,
  credentials: Credentials
): Promise<boolean> {
  return promiseRetry(
    retry =>
      hasOtherExportsForSessionWorker(exportId, credentials).catch(retry),
    RETRY_OPTIONS
  );
}

/**
 * Whether there are other exports for the same session credentials
 */
async function hasOtherExportsForSessionWorker(
  exportId: string,
  credentials: Credentials
): Promise<boolean> {
  const query = datastore
    .createQuery('Export')
    .filter('credentials', '=', hashCredentials(credentials));

  try {
    const [fusiontableExports] = await datastore.runQuery(query);
    const otherFusiontableExports = fusiontableExports.filter(
      fusiontableExport => fusiontableExport[datastore.KEY].name !== exportId
    );

    return otherFusiontableExports.length > 0;
  } catch (error) {
    throw error;
  }
}

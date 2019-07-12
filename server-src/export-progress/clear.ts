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
import deleteExportProgress from './delete-export';
import {RETRY_OPTIONS} from '../config/config';

const ONE_HOUR = 1000 * 60 * 60;

/**
 * Wrapper around the actual function with exponential retries
 */
export default function clearFinishedExports(): Promise<void> {
  return promiseRetry(
    retry => clearFinishedExportsWorker().catch(retry),
    RETRY_OPTIONS
  );
}

/**
 * Clear all finished exports
 */
async function clearFinishedExportsWorker(): Promise<void> {
  const oneHourAgo = Date.now() - ONE_HOUR;
  const query = datastore
    .createQuery('Export')
    .filter('lastUpdate', '<', oneHourAgo);

  try {
    const [fusiontableExports] = await datastore.runQuery(query);

    await Promise.all(
      fusiontableExports.map(fustiontableExport =>
        deleteExportProgress(fustiontableExport[datastore.KEY].name)
      )
    );
  } catch (error) {
    throw error;
  }
}

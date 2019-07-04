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
import datastore, {retryOptions} from './datastore';
import getExportTables from './get-export-tables';
import deleteExportProgress from './delete-export';

/**
 * Wrapper around the actual function with exponential retries
 */
export default function clearFinishedExports(): Promise<void> {
  return promiseRetry(
    retry => clearFinishedExportsWorker().catch(retry),
    retryOptions
  );
}

/**
 * Clear all finished exports
 */
async function clearFinishedExportsWorker(): Promise<void> {
  const query = datastore.createQuery('Export');

  try {
    const [fusiontableExports] = await datastore.runQuery(query);
    const exportIds = fusiontableExports.map(
      fustiontableExport => fustiontableExport[datastore.KEY].name
    );

    exportIds.forEach(async exportId => {
      const tables = await getExportTables(exportId);
      const allFinished = tables.every(table => table.status !== 'loading');

      if (allFinished) {
        deleteExportProgress(exportId);
      }
    });
  } catch (error) {
    throw error;
  }
}

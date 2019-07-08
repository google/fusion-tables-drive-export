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
import getExportTables from './get-export-tables';
import {RETRY_OPTIONS} from '../config/config';

/**
 * Wrapper around the actual function with exponential retries
 */
export default function deleteExportProgress(exportId: string): Promise<void> {
  return promiseRetry(
    retry => deleteExportProgressWorker(exportId).catch(retry),
    RETRY_OPTIONS
  );
}

/**
 * Delete an export from the log
 */
async function deleteExportProgressWorker(exportId: string): Promise<void> {
  try {
    const tables = await getExportTables(exportId);
    const keysToDelete = tables.map(table =>
      datastore.key(['Export', exportId, 'Table', table.tableId])
    );
    keysToDelete.push(datastore.key(['Export', exportId]));

    datastore.delete(keysToDelete);
  } catch (error) {
    throw error;
  }
}

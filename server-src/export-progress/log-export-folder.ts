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
import datastore, {excludeFromExportIndexes} from './datastore';
import {RETRY_OPTIONS} from '../config/config';

/**
 * Wrapper around the actual function with exponential retries
 */
export default function logExportFolder(
  exportId: string,
  folderId: string
): Promise<void> {
  return promiseRetry(
    retry => logExportFolderWorker(exportId, folderId).catch(retry),
    RETRY_OPTIONS
  );
}

/**
 * Log the ID of an export folder
 */
async function logExportFolderWorker(exportId: string, folderId: string) {
  const transaction = datastore.transaction();
  const key = datastore.key(['Export', exportId]);

  try {
    await transaction.run();
    const [fusiontableExport] = await transaction.get(key);
    fusiontableExport.exportFolderId = folderId;
    transaction.save({
      key,
      excludeFromIndexes: excludeFromExportIndexes,
      data: fusiontableExport
    });
    await transaction.commit();
  } catch (error) {
    transaction.rollback();
    throw error;
  }
}

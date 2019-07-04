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

/**
 * Wrapper around the actual function with exponential retries
 */
export default function getExportFolderId(
  exportId: string
): Promise<string | undefined> {
  return promiseRetry(
    retry => getExportFolderIdWorker(exportId).catch(retry),
    retryOptions
  );
}

/**
 * Get the tables of an export
 */
async function getExportFolderIdWorker(
  exportId: string
): Promise<string | undefined> {
  try {
    const key = datastore.key(['Export', exportId]);
    const [fusiontableExport] = await datastore.get(key);

    if (!fusiontableExport) {
      return undefined;
    }

    return fusiontableExport.exportFolderId;
  } catch (error) {
    throw error;
  }
}

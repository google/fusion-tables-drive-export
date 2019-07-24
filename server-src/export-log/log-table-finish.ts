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
import {RETRY_OPTIONS} from '../config/config';
import logInBigQuery from './bigquery';
import getHash from '../lib/get-hash';

/**
 * Wrapper around the actual function with exponential retries
 */
export default function logTableFinish(
  ipHash: string,
  exportId: string,
  tableId: string,
  status: 'success' | 'error',
  dataSize: number
): Promise<void> {
  return promiseRetry(
    retry =>
      logTableFinishWorker(ipHash, exportId, tableId, status, dataSize).catch(
        retry
      ),
    RETRY_OPTIONS
  );
}

/**
 * Log the finish of a table export
 */
async function logTableFinishWorker(
  ipHash: string,
  exportId: string,
  tableId: string,
  status: 'success' | 'error',
  dataSize: number
): Promise<void> {
  const hashedTableId = getHash(tableId).substr(0, 20);
  const dataSizeMb = Math.round(dataSize / 1024 / 1024) || 1;
  const statusText = status.substr(0, 1).toUpperCase() + status.substr(1);

  try {
    await logInBigQuery({
      type: 'table',
      event: 'finish',
      userId: ipHash,
      exportId,
      tableId: hashedTableId,
      tableStatus: status,
      exportedFileSize: dataSizeMb
    });

    console.info(
      `• ${statusText}! Finished table ${hashedTableId} with ${dataSizeMb}MB ` +
      `from export ${exportId} by user ${ipHash}`
    );
  } catch (error) {
    throw error;
  }
}

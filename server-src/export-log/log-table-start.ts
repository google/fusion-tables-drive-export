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
export default function logTableStart(
  ipHash: string,
  exportId: string,
  tableId: string
): Promise<void> {
  return promiseRetry(
    retry => logTableStartWorker(ipHash, exportId, tableId).catch(retry),
    RETRY_OPTIONS
  );
}

/**
 * Log the start of a table export
 */
async function logTableStartWorker(
  ipHash: string,
  exportId: string,
  tableId: string
): Promise<void> {
  const hashedTableId = getHash(tableId).substr(0, 20);

  try {
    await logInBigQuery({
      type: 'table',
      event: 'start',
      userId: ipHash,
      exportId,
      tableId: hashedTableId
    });

    console.info(
      `• Start export of table ${hashedTableId} from export ${exportId} by user ${ipHash}`
    );
  } catch (error) {
    throw error;
  }
}

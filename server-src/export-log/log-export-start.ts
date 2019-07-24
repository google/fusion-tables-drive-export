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

/**
 * Wrapper around the actual function with exponential retries
 */
export default function logExportStart(
  ipHash: string,
  exportId: string,
  tableCount: number
): Promise<void> {
  return promiseRetry(
    retry => logExportStartWorker(ipHash, exportId, tableCount).catch(retry),
    RETRY_OPTIONS
  );
}

/**
 * Log the start of an export
 */
async function logExportStartWorker(
  ipHash: string,
  exportId: string,
  tableCount: number
): Promise<void> {
  try {
    await logInBigQuery({
      type: 'export',
      event: 'start',
      exportId,
      userId: ipHash,
      tableCount
    });

    console.info(
      `• Start export ${exportId} with ${tableCount} tables by user ${ipHash}`
    );
  } catch (error) {
    throw error;
  }
}

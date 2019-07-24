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
export default function logExportFinish(
  ipHash: string,
  exportId: string
): Promise<void> {
  return promiseRetry(
    retry => logExportFinishWorker(ipHash, exportId).catch(retry),
    RETRY_OPTIONS
  );
}

/**
 * Log the finish of an export
 */
async function logExportFinishWorker(
  ipHash: string,
  exportId: string
): Promise<void> {
  try {
    await logInBigQuery({
      type: 'export',
      event: 'finish',
      exportId,
      userId: ipHash
    });

    console.info(`• Finished export ${exportId} by user ${ipHash}`);
  } catch (error) {
    throw error;
  }
}

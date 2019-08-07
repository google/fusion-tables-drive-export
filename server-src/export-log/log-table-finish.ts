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

/**
 * Log the finish of a table export
 */
export default function logTableFinish(
  exportId: string,
  tableId: number,
  status: 'success' | 'error',
  dataSize: number
): void {
  const statusText = status.substr(0, 1).toUpperCase() + status.substr(1);

  console.info(
    `• ${statusText}! Finished table ${tableId} with ${dataSize}MB ` +
      `from export ${exportId}.`
  );
}

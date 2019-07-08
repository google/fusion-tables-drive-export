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
import datastore, {excludeFromTableIndexes} from './datastore';
import {IStyle} from '../interfaces/style';
import {IFile} from '../interfaces/file';
import getStyleHash from '../lib/get-style-hash';
import {RETRY_OPTIONS} from '../config/config';

interface ILogTableParams {
  exportId: string;
  tableId: string;
  status: 'success' | 'error';
  error?: Error;
  driveFile?: IFile;
  styles: IStyle[];
  isLarge: boolean;
  hasGeometryData: boolean;
}

/**
 * Wrapper around the actual function with exponential retries
 */
export default function logTableExportProgress(
  params: ILogTableParams
): Promise<void> {
  return promiseRetry(
    retry => logTableExportProgressWorker(params).catch(retry),
    RETRY_OPTIONS
  );
}

/**
 * Log an table export
 */
async function logTableExportProgressWorker(params: ILogTableParams) {
  const {exportId, tableId} = params;
  const transaction = datastore.transaction();
  const key = datastore.key(['Export', exportId, 'Table', tableId]);

  try {
    await transaction.run();
    const [table] = await transaction.get(key);
    table.status = params.status;
    table.error = params.error;
    table.driveFile = params.driveFile;
    table.styles = params.styles.map(getStyleHash);
    table.isLarge = params.isLarge;
    table.hasGeometryData = params.hasGeometryData;
    transaction.save({
      key,
      excludeFromIndexes: excludeFromTableIndexes,
      data: table
    });
    await transaction.commit();
  } catch (error) {
    transaction.rollback();
    throw error;
  }
}

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

import {isString} from 'util';
import promiseRetry from 'promise-retry';
import datastore, {
  excludeFromTableIndexes,
  excludeFromExportIndexes
} from './datastore';
import {IStyle} from '../interfaces/style';
import {IFile} from '../interfaces/file';
import getStyleHash from '../lib/get-style-hash';
import {RETRY_OPTIONS} from '../config/config';

interface IUpdateTableParams {
  exportId: string;
  tableId: string;
  status: 'success' | 'error';
  error?: Error | string;
  driveFile?: IFile;
  styles: IStyle[];
  isLarge: boolean;
  hasGeometryData: boolean;
}

/**
 * Wrapper around the actual function with exponential retries
 */
export default function updateTableExportProgress(
  params: IUpdateTableParams
): Promise<void> {
  return promiseRetry(
    retry => updateTableExportProgressWorker(params).catch(retry),
    RETRY_OPTIONS
  );
}

/**
 * Update the table export progress
 */
async function updateTableExportProgressWorker(params: IUpdateTableParams) {
  const {exportId, tableId} = params;
  const transaction = datastore.transaction();
  const exportKey = datastore.key(['Export', exportId]);
  const tableKey = datastore.key(['Export', exportId, 'Table', tableId]);

  if (
    params.error &&
    isString(params.error) &&
    params.error.startsWith('User Rate Limit Exceeded.')
  ) {
    params.error =
      'Sheets API User Rate Limit Exceeded. ' +
      'Try exporting again and don’t run exports in parallel.';
  }

  try {
    await transaction.run();

    const [table] = await transaction.get(tableKey);
    table.status = params.status;
    table.error = params.error;
    table.driveFile = params.driveFile;
    table.styles = params.styles.map(getStyleHash);
    table.isLarge = params.isLarge;
    table.hasGeometryData = params.hasGeometryData;
    transaction.save({
      key: tableKey,
      excludeFromIndexes: excludeFromTableIndexes,
      data: table
    });

    const [fusiontableExport] = await transaction.get(exportKey);
    fusiontableExport.lastUpdate = Date.now();
    transaction.save({
      key: exportKey,
      excludeFromIndexes: excludeFromExportIndexes,
      data: fusiontableExport
    });

    await transaction.commit();
  } catch (error) {
    transaction.rollback();
    throw error;
  }
}

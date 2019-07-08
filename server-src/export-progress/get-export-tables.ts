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
import {TABLES_PER_PAGE, RETRY_OPTIONS} from '../config/config';
import {ITableExport} from '../interfaces/table-export';

/**
 * Wrapper around the actual function with exponential retries
 */
export default function getExportTables(
  exportId: string
): Promise<ITableExport[]> {
  return promiseRetry(
    retry => getExportTablesWorker(exportId).catch(retry),
    RETRY_OPTIONS
  );
}

/**
 * Get the tables of an export
 */
async function getExportTablesWorker(
  exportId: string
): Promise<ITableExport[]> {
  const exportKey = datastore.key(['Export', exportId]);
  const query = datastore.createQuery('Table').hasAncestor(exportKey);

  query.order('tableName');
  query.limit(TABLES_PER_PAGE);

  try {
    const [tables] = await datastore.runQuery(query);
    return tables.sort(sortByTableName);
  } catch (error) {
    throw error;
  }
}

/**
 * Sort by tableName property
 */
function sortByTableName(a: ITableExport, b: ITableExport): number {
  const nameA = a.tableName.toUpperCase();
  const nameB = b.tableName.toUpperCase();

  if (nameA < nameB) {
    return -1;
  }
  if (nameA > nameB) {
    return 1;
  }

  return 0;
}

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

import uuid from 'uuid/v4';
import promiseRetry from 'promise-retry';
import datastore, {
  excludeFromExportIndexes,
  excludeFromTableIndexes,
  retryOptions
} from './datastore';
import {ITable} from '../interfaces/table';
import {ITableExport} from '../interfaces/table-export';
import {entity} from '@google-cloud/datastore/build/src/entity';
import {Credentials} from 'google-auth-library';
import hashCredentials from '../lib/hash-credentials';

interface IExportEntity {
  key: entity.Key;
  excludeFromIndexes: string[];
  data: {
    credentials: string;
    exportFolderId?: string;
  };
}

interface ITableEntity {
  key: entity.Key;
  excludeFromIndexes: string[];
  data: ITableExport;
}

/**
 * Wrapper around the actual function with exponential retries
 */
export default function initExportProgress(
  credentials: Credentials,
  tables: ITable[]
): Promise<string> {
  return promiseRetry(
    retry => initExportProgressWorker(credentials, tables).catch(retry),
    retryOptions
  );
}

/**
 * Create a new export
 */
async function initExportProgressWorker(
  credentials: Credentials,
  tables: ITable[]
): Promise<string> {
  const exportId = uuid();

  const entities: Array<IExportEntity | ITableEntity> = [
    {
      key: datastore.key(['Export', exportId]),
      excludeFromIndexes: excludeFromExportIndexes,
      data: {
        credentials: hashCredentials(credentials)
      }
    }
  ];

  tables.forEach(table =>
    entities.push({
      key: datastore.key(['Export', exportId, 'Table', table.id]),
      excludeFromIndexes: excludeFromTableIndexes,
      data: {
        status: 'loading',
        tableId: table.id,
        tableName: table.name,
        styles: [],
        isLarge: false,
        hasGeometryData: false
      }
    })
  );

  try {
    await datastore.save(entities);
  } catch (error) {
    throw error;
  }

  return exportId;
}

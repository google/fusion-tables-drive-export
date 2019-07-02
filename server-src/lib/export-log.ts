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
import {TABLES_PER_PAGE} from '../config/config';
import {ITable} from '../interfaces/table';
import {ITableExport} from '../interfaces/table-export';
import {IStyle} from '../interfaces/style';
import {Datastore} from '@google-cloud/datastore';
import {entity} from '@google-cloud/datastore/build/src/entity';
import {Credentials} from 'google-auth-library';
import {drive_v3} from 'googleapis';
import getStyleHash from './get-style-hash';
import hashCredentials from './hash-credentials';

interface ILogTable {
  exportId: string;
  tableId: string;
  status: 'success' | 'error';
  error?: Error;
  driveFile?: drive_v3.Schema$File;
  styles: IStyle[];
  isLarge: boolean;
  hasGeometryData: boolean;
}

interface IExportEntity {
  key: entity.Key;
  excludeFromIndexes: string[];
  data: {
    credentials: string;
    exportFolderId?: string;
  };
}

const excludeFromExportIndexes = ['credentials', 'exportFolderId'];

interface ITableEntity {
  key: entity.Key;
  excludeFromIndexes: string[];
  data: ITableExport;
}

const excludeFromTableIndexes = [
  'status',
  'error',
  'tableId',
  'driveFile',
  'styles',
  'styles[]',
  'isLarge',
  'hasGeometryData'
];

/**
 * A log containing the exported tables
 */
export default class {
  private datastore: Datastore = new Datastore({
    keyFilename: './server-src/config/datastore-credentials.json'
  });

  /**
   * Create a new export
   */
  public async startExport(
    credentials: Credentials,
    tables: ITable[]
  ): Promise<string> {
    const exportId = uuid();

    const entities: Array<IExportEntity | ITableEntity> = [
      {
        key: this.datastore.key(['Export', exportId]),
        excludeFromIndexes: excludeFromExportIndexes,
        data: {
          credentials: hashCredentials(credentials)
        }
      }
    ];

    tables.forEach(table =>
      entities.push({
        key: this.datastore.key(['Export', exportId, 'Table', table.id]),
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
      await this.datastore.save(entities);
    } catch (error) {
      throw error;
    }

    return exportId;
  }

  /**
   * Check whether an user is autheticated for that export
   */
  public async isAuthorized(
    exportId: string,
    credentials: Credentials
  ): Promise<boolean> {
    try {
      const key = this.datastore.key(['Export', exportId]);
      const [fusiontableExport] = await this.datastore.get(key);

      return (
        fusiontableExport &&
        fusiontableExport.credentials &&
        fusiontableExport.credentials === hashCredentials(credentials)
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * Log the ID of an export folder
   */
  public async logExportFolder(exportId: string, folderId: string) {
    const transaction = this.datastore.transaction();
    const key = this.datastore.key(['Export', exportId]);

    try {
      await transaction.run();
      const [fusiontableExport] = await transaction.get(key);
      fusiontableExport.exportFolderId = folderId;
      transaction.save({
        key,
        excludeFromIndexes: excludeFromExportIndexes,
        data: fusiontableExport
      });
      await transaction.commit();
    } catch (error) {
      transaction.rollback();
      throw error;
    }
  }

  /**
   * Log an table export
   */
  public async logTable(params: ILogTable) {
    const {exportId, tableId} = params;
    const transaction = this.datastore.transaction();
    const key = this.datastore.key(['Export', exportId, 'Table', tableId]);

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

  /**
   * Get the tables of an export
   */
  public async getExportFolderId(
    exportId: string
  ): Promise<string | undefined> {
    try {
      const key = this.datastore.key(['Export', exportId]);
      const [fusiontableExport] = await this.datastore.get(key);

      if (!fusiontableExport) {
        return undefined;
      }

      return fusiontableExport.exportFolderId;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get the tables of an export
   */
  public async getExportTables(exportId: string): Promise<ITableExport[]> {
    const exportKey = this.datastore.key(['Export', exportId]);
    const query = this.datastore.createQuery('Table').hasAncestor(exportKey);

    query.order('tableName');
    query.limit(TABLES_PER_PAGE);

    try {
      const [tables] = await this.datastore.runQuery(query);
      return tables.sort(sortByTableName);
    } catch (error) {
      throw error;
    }
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

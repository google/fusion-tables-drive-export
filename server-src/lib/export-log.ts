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
import {ITable} from '../interfaces/table';
import {ITableExport} from '../interfaces/table-export';
import {IStyle} from '../interfaces/style';
import {Credentials} from 'google-auth-library';
import {drive_v3} from 'googleapis';
import getStyleHash from './get-style-hash';

interface IFusiontableExports {
  [exportId: string]: {
    credentials: Credentials;
    exportFolderId?: string;
    tables: {
      [tablesId: string]: ITableExport;
    };
  };
}

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

/**
 * A log containing the exported tables
 */
export default class {
  private fusiontableExports: IFusiontableExports = {};

  /**
   * Create a new export
   */
  public startExport(credentials: Credentials, tables: ITable[]): string {
    const exportId = uuid();

    this.fusiontableExports[exportId] = {
      credentials,
      tables: {}
    };

    tables.forEach(
      table =>
        (this.fusiontableExports[exportId].tables[table.id] = {
          status: 'loading',
          table: {
            id: table.id,
            name: table.name
          },
          styles: [],
          isLarge: false,
          hasGeometryData: false
        })
    );

    return exportId;
  }

  /**
   * Check whether an user is autheticated for that export
   */
  public isAuthorized(exportId: string, credentials: string) {
    const fusiontableExport = this.fusiontableExports[exportId];

    return (
      fusiontableExport &&
      JSON.stringify(fusiontableExport.credentials) ===
        JSON.stringify(credentials)
    );
  }

  /**
   * Log the ID of an export folder
   */
  public logExportFolder(exportId: string, folderId: string) {
    this.fusiontableExports[exportId].exportFolderId = folderId;
  }

  /**
   * Log an table export
   */
  public logTable(params: ILogTable) {
    const {exportId, tableId} = params;
    const table = this.fusiontableExports[exportId].tables[tableId];

    table.status = params.status;
    table.error = params.error;
    table.driveFile = params.driveFile;
    table.styles = params.styles.map(getStyleHash);
    table.isLarge = params.isLarge;
    table.hasGeometryData = params.hasGeometryData;
  }

  /**
   * Get the tables of an export
   */
  public getExportFolderId(exportId: string): string | undefined {
    if (!this.fusiontableExports[exportId]) {
      return undefined;
    }

    return this.fusiontableExports[exportId].exportFolderId;
  }

  /**
   * Get the tables of an export
   */
  public getExportTables(exportId: string): ITableExport[] {
    if (!this.fusiontableExports[exportId]) {
      return [];
    }

    return Object.values(this.fusiontableExports[exportId].tables);
  }
}

import uuid from 'uuid/v4';
import {ITable} from './interfaces/table';
import {ITableExport} from './interfaces/table-export';
import {Credentials} from 'google-auth-library';
import {drive_v3} from 'googleapis';

interface IFusiontableExports {
  [exportId: string]: {
    credentials: Credentials;
    tables: {
      [tablesId: string]: ITableExport;
    };
  };
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
          table
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
   * Log a success
   */
  public logSuccess(
    exportId: string,
    tableId: string,
    driveFile: drive_v3.Schema$File
  ) {
    const table = this.fusiontableExports[exportId].tables[tableId];
    table.status = 'success';
    table.driveFile = driveFile;
  }

  /**
   * Log an error
   */
  public logError(
    exportId: string,
    tableId: string,
    error: Error,
    driveFile?: drive_v3.Schema$File
  ) {
    const table = this.fusiontableExports[exportId].tables[tableId];
    table.status = 'error';
    table.error = error;
    table.driveFile = driveFile;
  }

  /**
   * Get the tables of an export
   */
  public getExport(exportId: string): ITableExport[] {
    return Object.values(this.fusiontableExports[exportId].tables);
  }
}

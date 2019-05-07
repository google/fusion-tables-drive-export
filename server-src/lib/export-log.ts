import uuid from 'uuid/v4';
import {ITable} from '../interfaces/table';
import {ITableExport} from '../interfaces/table-export';
import {IStyle} from '../interfaces/style';
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

interface ILogTable {
  exportId: string;
  tableId: string;
  status: 'success' | 'error';
  error?: Error;
  driveFile?: drive_v3.Schema$File;
  styles: IStyle[];
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
   * Log an table export
   */
  public logTable(params: ILogTable) {
    const {exportId, tableId} = params;
    const table = this.fusiontableExports[exportId].tables[tableId];

    table.status = params.status;
    table.error = params.error;
    table.driveFile = params.driveFile;
    table.styles = params.styles;
    table.hasGeometryData = params.hasGeometryData;
  }

  /**
   * Get the tables of an export
   */
  public getExport(exportId: string): ITableExport[] {
    return Object.values(this.fusiontableExports[exportId].tables);
  }
}

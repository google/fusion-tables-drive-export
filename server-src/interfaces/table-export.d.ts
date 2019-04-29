import {ITable} from './table';
import {drive_v3} from 'googleapis';

/**
 * A table-finished emitter event data
 */
export type ITableExport = {
  status: 'loading' | 'success' | 'error';
  error?: Error;
  readonly table: ITable;
  driveFile?: drive_v3.Schema$File | null;
};

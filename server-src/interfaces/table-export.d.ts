import {ITable} from './table';
import {IStyle} from './style';
import {drive_v3} from 'googleapis';

/**
 * A table-finished emitter event data
 */
export type ITableExport = {
  status: 'loading' | 'success' | 'error';
  error?: Error;
  readonly table: {
    id: string;
    name: string;
  };
  driveFile?: drive_v3.Schema$File | null;
  styles: string[];
  isLarge: boolean;
  hasGeometryData: boolean;
};

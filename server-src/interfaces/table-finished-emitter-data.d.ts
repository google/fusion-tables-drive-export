import {ITable} from './table';
import {drive_v3} from 'googleapis';
import {Credentials} from 'google-auth-library';

/**
 * A table-finished emitter event data
 */
export type ITableFinishedEmitterData = {
  readonly table: ITable;
  readonly driveFile: drive_v3.Schema$File;
  readonly credentials: Credentials;
};

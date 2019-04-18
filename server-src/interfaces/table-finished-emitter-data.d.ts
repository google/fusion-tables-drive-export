import {ITable} from './table';
import {drive_v3} from 'googleapis';
import {Credentials} from 'google-auth-library';

/**
 * A table-finished emitter event data
 */
export type ITableFinishedEmitterData = {
  readonly error?: Error;
  readonly table: ITable;
  readonly driveFile: drive_v3.Schema$File | null;
  readonly credentials: Credentials;
};

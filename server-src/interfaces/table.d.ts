import {drive_v3} from 'googleapis';

/**
 * A table
 */
export type ITable = {
  readonly id: string;
  readonly name: string;
  readonly permissions: drive_v3.Schema$Permission[];
};

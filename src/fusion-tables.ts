import {google} from 'googleapis';
import {parse as json2csv} from 'json2csv';
import {OAuth2Client} from 'google-auth-library';
import {ITable} from './interfaces/table';
import {ICsv} from './interfaces/csv';

const fusiontables = google.fusiontables('v2');

export default class {
  private oauth2Client: OAuth2Client;

  constructor(oauth2Client: OAuth2Client) {
    this.oauth2Client = oauth2Client;
  }

  /**
   * Get the tables for the authenticated user account
   */
  public async getTables(): Promise<ITable[]> {
    const {data} = await fusiontables.table.list({
      auth: this.oauth2Client,
      maxResults: 1000
    });

    if (!data.items) {
      return [];
    }

    return data.items
      .filter(table => table.tableId)
      .map(table => ({
        id: table.tableId || '',
        name: table.name || table.tableId || ''
      }));
  }

  /**
   * Get the CSV export for a table
   */
  public async getCSV(table: ITable): Promise<ICsv> {
    const {data} = await fusiontables.query.sqlGet({
      auth: this.oauth2Client,
      sql: `SELECT * FROM ${table.id}`
    });

    const json = [data.columns].concat(data.rows);
    const csv = json2csv(json, {header: false});

    return {
      name: table.name,
      filename: `${table.name}.csv`,
      data: csv
    };
  }
}

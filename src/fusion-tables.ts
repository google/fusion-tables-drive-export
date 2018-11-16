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
  public getTables(): Promise<ITable[]> {
    return fusiontables.table
      .list({
        auth: this.oauth2Client,
        maxResults: 1000
      })
      .then(result => {
        if (!result.data.items) {
          return [];
        }

        return result.data.items
          .filter(table => table.tableId)
          .map(table => ({
            id: table.tableId || '',
            name: table.name || table.tableId || ''
          }));
      });
  }

  /**
   * Get the CSV export for a table
   */
  public getCSV(table: ITable): Promise<ICsv> {
    return fusiontables.query
      .sqlGet({
        auth: this.oauth2Client,
        sql: `SELECT * FROM ${table.id}`
      })
      .then(result => result.data)
      .then(data => [data.columns].concat(data.rows))
      .then(json => json2csv(json, {header: false}))
      .then(csv => ({
        name: table.name,
        filename: `${table.name}.csv`,
        data: csv
      }));
  }
}

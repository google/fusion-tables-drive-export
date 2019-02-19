import {google} from 'googleapis';
import fetch from 'node-fetch';
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
    const {token} = await this.oauth2Client.getAccessToken();
    const query = `SELECT * FROM ${table.id}`;
    const url =
      'https://www.googleapis.com/fusiontables/v2/query' +
      `?sql=${encodeURIComponent(query)}&alt=media`;
    const options = {
      headers: {
        'Accept-Encoding': 'gzip',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`
      }
    };

    const response = await fetch(url, options);
    const csv = await response.text();

    return {
      name: table.name,
      filename: `${table.name}.csv`,
      data: csv
    };
  }
}

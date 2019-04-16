import fetch from 'node-fetch';
import {OAuth2Client} from 'google-auth-library';
import {ITable} from '../interfaces/table';
import {ICsv} from '../interfaces/csv';

/**
 * Get the CSV export for a table
 */
export default async function(
  auth: OAuth2Client,
  table: ITable
): Promise<ICsv> {
  const {token} = await auth.getAccessToken();
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

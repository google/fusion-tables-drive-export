import {google} from 'googleapis';
import {OAuth2Client} from 'google-auth-library';
import {ITable} from '../interfaces/table';

const fusiontables = google.fusiontables('v2');

/**
 * Get the tables for the authenticated user account
 */
export default async function(auth: OAuth2Client): Promise<ITable[]> {
  const {data} = await fusiontables.table.list({
    auth,
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

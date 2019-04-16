import {google} from 'googleapis';
import {OAuth2Client} from 'google-auth-library';
import pLimit from 'p-limit';
import {ITable} from '../interfaces/table';
import userIsFileOwner from '../drive/user-is-file-owner';

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

  const limit = pLimit(10);

  const tables = await Promise.all(
    data.items
      .filter(table => table.tableId)
      .map(table =>
        limit(async () => ({
          ...table,
          ownedByUser: await userIsFileOwner(auth, table.tableId as string)
        }))
      )
  );

  return tables
    .filter(table => table.ownedByUser)
    .map(table => ({
      id: table.tableId as string,
      name: table.name || table.tableId as string
    }));
}

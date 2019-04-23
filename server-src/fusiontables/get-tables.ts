import {google} from 'googleapis';
import {OAuth2Client} from 'google-auth-library';
import pLimit from 'p-limit';
import {ITable} from '../interfaces/table';
import getFilePermissions from '../drive/get-file-permissions';

const fusiontables = google.fusiontables('v2');

/**
 * Get the tables for the authenticated user account
 */
export default async function(
  auth: OAuth2Client,
  ids?: string[]
): Promise<ITable[]> {
  try {
    const {data} = await fusiontables.table.list({
      auth,
      maxResults: 1000
    });

    if (!data.items) {
      return [];
    }

    const limit = pLimit(10);
    let allTablesToCheck = data.items.filter(table => table.tableId);

    if (ids) {
      allTablesToCheck = allTablesToCheck.filter(table =>
        ids.includes(table.tableId as string)
      );
    }

    const tables = await Promise.all(
      allTablesToCheck.map(table =>
        limit(async () => {
          const {ownedByMe, permissions} = await getFilePermissions(
            auth,
            table.tableId as string
          );

          return {
            ...table,
            ownedByUser: ownedByMe,
            permissions
          };
        })
      )
    );

    return tables
      .filter(table => table.ownedByUser)
      .map(table => ({
        id: table.tableId as string,
        name: table.name || (table.tableId as string),
        permissions: table.permissions || []
      }));
  } catch (error) {
    throw error;
  }
}

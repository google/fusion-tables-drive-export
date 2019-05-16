import {google} from 'googleapis';
import {OAuth2Client} from 'google-auth-library';

const fusiontables = google.fusiontables('v2');

/**
 * Get the tables for the authenticated user account
 */
export default async function(
  auth: OAuth2Client,
  tableId: string
): Promise<Array<{name: string; isImage: boolean}>> {
  try {
    const {data} = await fusiontables.column.list({
      auth,
      tableId,
      maxResults: 1000
    });

    if (!data.items) {
      return [];
    }

    return data.items.map(column => ({
      name: column.name || '',
      isImage:
        column.formatPattern === 'STRING_EIGHT_LINE_IMAGE' ||
        column.formatPattern === 'STRING_FOUR_LINE_IMAGE' ||
        column.formatPattern === 'STRING_ONE_LINE_IMAGE'
    }));
  } catch (error) {
    throw error;
  }
}

import {google} from 'googleapis';
import {OAuth2Client} from 'google-auth-library';
import {ITable} from '../interfaces/table';

const drive = google.drive('v3');

/**
 * Find all Fusiontables owned by user
 */
export default async function(
  auth: OAuth2Client,
  ids?: string[]
): Promise<ITable[]> {
  try {
    const response = await drive.files.list({
      auth,
      orderBy: 'name',
      pageSize: 1000,
      fields: 'files(id,name,permissions)',
      q:
        // tslint:disable quotemark
        "'me' in owners and " +
        "mimeType = 'application/vnd.google-apps.fusiontable' and " +
        'trashed = false'
        // tslint:enable quotemark
    });
    let files = response.data.files;

    if (!files) {
      return [];
    }

    if (ids) {
      files = files.filter(file => ids.includes(file.id as string));
    }

    return files as ITable[];
  } catch (error) {
    throw error;
  }
}

import {google, drive_v3} from 'googleapis';
import {OAuth2Client} from 'google-auth-library';
import getArchiveFolder from './get-archive-folder';
import {getDriveSubfolderName, MIME_TYPES} from '../config';

const drive = google.drive('v3');

/**
 * Create the Fusion Tables subfolder for an export
 */
export default async function(auth: OAuth2Client): Promise<string> {
  try {
    const archiveFolderId = await getArchiveFolder(auth);

    const response = await drive.files.create({
      auth,
      resource: {
        name: getDriveSubfolderName(),
        parents: [archiveFolderId],
        mimeType: MIME_TYPES.folder
      }
    } as drive_v3.Params$Resource$Files$Create);

    if (response.statusText !== 'OK') {
      console.error('ERROR!', response);
    }

    return response.data.id as string;
  } catch (error) {
    throw error;
  }
}

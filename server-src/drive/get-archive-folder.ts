import {google, drive_v3} from 'googleapis';
import {OAuth2Client} from 'google-auth-library';
import {DRIVE_ARCHIVE_FOLDER, MIME_TYPES} from '../config';
import findFile from './find-file';

const drive = google.drive('v3');

/**
 * Get the ID for the Fusion Tables Archive folder
 */
export default async function(auth: OAuth2Client): Promise<string> {
  try {
    const archiveFolderId = await findFile(auth, DRIVE_ARCHIVE_FOLDER, 'root');

    if (archiveFolderId) {
      return archiveFolderId;
    }

    return createArchiveFolder(auth);
  } catch (error) {
    throw error;
  }
}

/**
 * Create the Fusion Tables Archive folder
 */
async function createArchiveFolder(auth: OAuth2Client): Promise<string> {
  try {
    const response = await drive.files.create({
      auth,
      resource: {
        name: DRIVE_ARCHIVE_FOLDER,
        mimeType: MIME_TYPES.folder
      }
    } as drive_v3.Params$Resource$Files$Create);

    if (response.statusText !== 'OK') {
      throw new Error(`Cannot create archive folder: ${response.statusText}`);
    }

    return response.data.id as string;
  } catch (error) {
    throw error;
  }
}

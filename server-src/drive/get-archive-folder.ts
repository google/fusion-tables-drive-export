import {google, drive_v3} from 'googleapis';
import {OAuth2Client} from 'google-auth-library';
import {DRIVE_ARCHIVE_FOLDER, MIME_TYPES} from '../config';
import findFile from './find-file';

const drive = google.drive('v3');

/**
 * Get the ID for the Fusion Tables Archive folder
 */
export default async function(auth: OAuth2Client): Promise<string> {
  const archiveFolderId = await findFile(auth, DRIVE_ARCHIVE_FOLDER, 'root');

  if (archiveFolderId) {
    return archiveFolderId;
  }

  return createArchiveFolder(auth);
}

/**
 * Create the Fusion Tables Archive folder
 */
async function createArchiveFolder(auth: OAuth2Client): Promise<string> {
  const response = await drive.files.create({
    auth,
    resource: {
      name: DRIVE_ARCHIVE_FOLDER,
      mimeType: MIME_TYPES.folder
    }
  } as drive_v3.Params$Resource$Files$Create);

  if (response.statusText !== 'OK') {
    console.error('ERROR!', response);
  }

  return response.data.id as string;
}

import {google, drive_v3} from 'googleapis';
import {OAuth2Client} from 'google-auth-library';
import {DRIVE_ARCHIVE_FOLDER, getDriveSubfolderName} from '../config';

const drive = google.drive('v3');

/**
 * Create the Fusion Tables folder
 */
export default async function(auth: OAuth2Client): Promise<string> {
  const archiveFolderId = await getArchiveFolderId(auth);

  const response = await drive.files.create({
    auth,
    resource: {
      name: getDriveSubfolderName(),
      parents: [archiveFolderId],
      mimeType: 'application/vnd.google-apps.folder'
    }
  } as drive_v3.Params$Resource$Files$Create);

  if (response.statusText !== 'OK') {
    console.error('ERROR!', response);
  }

  return response.data.id as string;
}

/**
 * Get the ID for the Fusion Tables Archive folder
 */
async function getArchiveFolderId(auth: OAuth2Client): Promise<string> {
  const response = await drive.files.list({
    auth,
    q: `name='${DRIVE_ARCHIVE_FOLDER}' and 'root' in parents and trashed = false`
  });
  const files = response.data.files;

  if (files && files.length > 0 && files[0].id) {
    return files[0].id;
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
      mimeType: 'application/vnd.google-apps.folder'
    }
  } as drive_v3.Params$Resource$Files$Create);

  if (response.statusText !== 'OK') {
    console.error('ERROR!', response);
  }

  return response.data.id as string;
}

import {Readable} from 'stream';
import {google, drive_v3} from 'googleapis';
import {OAuth2Client} from 'google-auth-library';
import {ICsv} from '../interfaces/csv';
import {DRIVE_ARCHIVE_FOLDER, getDriveSubfolderName} from '../config';

const drive = google.drive('v3');
const MIME_TYPES = {
  csv: 'text/csv',
  spreadsheet: 'application/vnd.google-apps.spreadsheet'
};

/**
 * Upload the CSV
 */
export default async function(
  auth: OAuth2Client,
  csv: ICsv
): Promise<drive_v3.Schema$File> {
  if (csv.hasLargeCells) {
    return doUpload(auth, csv, MIME_TYPES.csv);
  }

  try {
    const file = doUpload(auth, csv, MIME_TYPES.spreadsheet);
    return file;
  } catch (error) {
    return doUpload(auth, csv, MIME_TYPES.csv);
  }
}

/**
 * Upload the CSV
 */
async function doUpload(
  auth: OAuth2Client,
  csv: ICsv,
  mimeType: string
): Promise<drive_v3.Schema$File> {
  const folderId = await createSubfolder(auth);
  const stream = new Readable();
  stream._read = () => {
    return;
  };
  stream.push(csv.data);
  stream.push(null);

  const file = await drive.files.create({
    auth,
    requestBody: {
      mimeType,
      name: csv.name,
      parents: [folderId]
    },
    media: {
      mimeType: MIME_TYPES.csv,
      body: stream
    }
  });

  return file.data;
}

/**
 * Create the Fusion Tables folder
 */
async function createSubfolder(auth: OAuth2Client): Promise<string> {
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

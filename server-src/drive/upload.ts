import {Readable} from 'stream';
import {google, drive_v3} from 'googleapis';
import {OAuth2Client} from 'google-auth-library';
import {ICsv} from '../interfaces/csv';
import {MIME_TYPES} from '../config';

const drive = google.drive('v3');

/**
 * Upload the CSV
 */
export default async function(
  auth: OAuth2Client,
  folderId: string,
  csv: ICsv
): Promise<drive_v3.Schema$File> {
  if (csv.hasLargeCells) {
    return doUpload({auth, csv, mimeType: MIME_TYPES.csv, folderId});
  }

  try {
    const file = doUpload({
      auth,
      csv,
      mimeType: MIME_TYPES.spreadsheet,
      folderId
    });
    return file;
  } catch (error) {
    return doUpload({auth, csv, mimeType: MIME_TYPES.csv, folderId});
  }
}

/**
 * Upload the CSV
 */
async function doUpload({
  auth,
  csv,
  mimeType,
  folderId
}: {
  auth: OAuth2Client;
  csv: ICsv;
  mimeType: string;
  folderId: string;
}): Promise<drive_v3.Schema$File> {
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
      name: `ft-${csv.name}`,
      parents: [folderId]
    },
    media: {
      mimeType: MIME_TYPES.csv,
      body: stream
    }
  });

  return file.data;
}

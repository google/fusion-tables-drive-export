import {google, drive_v3, sheets_v4} from 'googleapis';
import {OAuth2Client} from 'google-auth-library';
import getArchiveFolder from './get-archive-folder';
import findFile from './find-file';
import {DRIVE_ARCHIVE_INDEX_SHEET, MIME_TYPES} from '../config';

const drive = google.drive('v3');
const sheets = google.sheets('v4');

const headerRowContent =  [
  'Exported file name',
  'Source Fusiontable',
  'Exported Spreadsheet/CSV',
  'Visualization',
  'Exported at'
].join(',');

/**
 * Get the Archive Index Sheet
 */
export default async function(auth: OAuth2Client): Promise<string> {
  const archiveFolderId = await getArchiveFolder(auth);
  const sheetId = await findFile(auth, DRIVE_ARCHIVE_INDEX_SHEET, archiveFolderId);

  if (sheetId) {
    return sheetId;
  }

  return createSheet(auth, archiveFolderId);
}

/**
 * Create the Archive Index Sheet with a title row
 */
async function createSheet(auth: OAuth2Client, archiveFolderId: string): Promise<string> {
  const createResponse = await drive.files.create({
    auth,
    resource: {
      name: DRIVE_ARCHIVE_INDEX_SHEET,
      parents: [archiveFolderId],
      mimeType: MIME_TYPES.spreadsheet
    },
    media: {
      mimeType: MIME_TYPES.csv,
      body: headerRowContent
    }
  } as drive_v3.Params$Resource$Files$Create);

  if (createResponse.statusText !== 'OK') {
    console.error('ERROR!', createResponse);
  }

  const spreadsheetId = createResponse.data.id as string;

  return spreadsheetId;
}

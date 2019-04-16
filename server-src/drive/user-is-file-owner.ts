import {google} from 'googleapis';
import {OAuth2Client} from 'google-auth-library';

const drive = google.drive('v3');

export default async function(
  auth: OAuth2Client,
  tableId: string
): Promise<boolean> {
  const response = await drive.files.get({
    auth,
    fileId: tableId,
    fields: 'ownedByMe'
  });

  return Boolean(response.data.ownedByMe);
}

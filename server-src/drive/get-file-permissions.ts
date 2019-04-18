import {google, drive_v3} from 'googleapis';
import {OAuth2Client} from 'google-auth-library';

const drive = google.drive('v3');

/**
 * Get the permissions for the passed fileId
 */
export default async function(
  auth: OAuth2Client,
  fileId: string
): Promise<drive_v3.Schema$File> {
  try {
    console.log('GET FILE PERMISSIONS');
    const response = await drive.files.get({
      auth,
      fileId,
      fields: 'permissions,ownedByMe'
    });

    return response.data;
  } catch (error) {
    throw error;
  }
}

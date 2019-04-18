import {google, drive_v3} from 'googleapis';
import {OAuth2Client} from 'google-auth-library';

const drive = google.drive('v3');

/**
 * Get the permissions for the passed fileId
 */
export default async function(
  auth: OAuth2Client,
  fileId: string
): Promise<drive_v3.Schema$Permission[]> {
  try {
    const response = await drive.files.get({
      auth,
      fileId,
      fields: 'permissions'
    });

    return response.data.permissions as drive_v3.Schema$Permission[];
  } catch (error) {
    throw error;
  }
}

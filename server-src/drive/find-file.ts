import {google} from 'googleapis';
import {OAuth2Client} from 'google-auth-library';

const drive = google.drive('v3');

/**
 * Find a file / folder in Drive
 */
export default async function(
  auth: OAuth2Client,
  name: string,
  parentId: string
): Promise<string | null> {
  const response = await drive.files.list({
    auth,
    q: `name='${name}' and '${parentId}' in parents and trashed = false`
  });
  const files = response.data.files;

  if (files && files.length > 0 && files[0].id) {
    return files[0].id;
  }

  return null;
}

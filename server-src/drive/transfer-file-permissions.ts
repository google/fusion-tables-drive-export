import {OAuth2Client} from 'google-auth-library';
import getFilePermissions from './get-file-permissions';
import addFilePermissions from './add-file-permissions';

/**
 * Transfer the permissions from the sourceFileId to the targetFileId
 */
export default async function(
  auth: OAuth2Client,
  sourceFileId: string,
  targetFileId: string
): Promise<void> {
  try {
    const permissions = await getFilePermissions(auth, sourceFileId);
    await addFilePermissions(auth, targetFileId, permissions);
  } catch (error) {
    throw error;
  }

  return;
}

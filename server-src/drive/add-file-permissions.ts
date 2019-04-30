import {google, drive_v3} from 'googleapis';
import {OAuth2Client} from 'google-auth-library';
import pLimit from 'p-limit';

const drive = google.drive('v3');

/**
 * Add permissions to the passed fileId
 */
export default function(
  auth: OAuth2Client,
  fileId: string,
  permissions: drive_v3.Schema$Permission[]
): Promise<void[]> {
  const limit = pLimit(1);

  return Promise.all(
    permissions
      .filter(permission => permission.role !== 'owner')
      .map(permission =>
        limit(() => addFilePermission(auth, fileId, permission))
      )
  );
}

/**
 * Add a permission to the passed fileId
 */
async function addFilePermission(
  auth: OAuth2Client,
  fileId: string,
  permission: drive_v3.Schema$Permission
): Promise<void> {
  const {role, type} = permission;

  const params: drive_v3.Params$Resource$Permissions$Create = {
    auth,
    fileId,
    requestBody: {role, type}
  };

  if ((type === 'domain' || type === 'anyone') && params.requestBody) {
    params.requestBody.allowFileDiscovery = permission.allowFileDiscovery;
  }

  if (
    (type === 'user' || type === 'group') &&
    role !== 'owner' &&
    params.requestBody
  ) {
    params.sendNotificationEmail = false;
  }

  if (role === 'owner') {
    params.transferOwnership = true;
  }

  if (permission.emailAddress && params.requestBody) {
    params.requestBody.emailAddress = permission.emailAddress;
  }

  if (permission.domain && params.requestBody) {
    params.requestBody.domain = permission.domain;
  }

  try {
    await drive.permissions.create(params);
  } catch (error) {
    throw error;
  }

  return;
}

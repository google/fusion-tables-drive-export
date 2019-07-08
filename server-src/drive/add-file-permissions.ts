/*!
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {google, drive_v3} from 'googleapis';
import {OAuth2Client} from 'google-auth-library';
import pLimit from 'p-limit';
import promiseRetry from 'promise-retry';
import {RETRY_OPTIONS} from '../config/config';

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
 * Wrapper around the actual function with exponential retries
 */
function addFilePermission(
  auth: OAuth2Client,
  fileId: string,
  permission: drive_v3.Schema$Permission
): Promise<void> {
  return promiseRetry(
    retry => addFilePermissionWorker(auth, fileId, permission).catch(retry),
    RETRY_OPTIONS
  );
}

/**
 * Add a permission to the passed fileId
 */
async function addFilePermissionWorker(
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
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await drive.permissions.create(params);
    } catch (error) {
      throw error;
    }
  }

  return;
}

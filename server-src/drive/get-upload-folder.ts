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
import promiseRetry from 'promise-retry';
import {
  getDriveSubfolderName,
  MIME_TYPES,
  RETRY_OPTIONS
} from '../config/config';

const drive = google.drive('v3');

/**
 * Wrapper around the actual function with exponential retries
 */
export default function getUploadFolder(
  auth: OAuth2Client,
  archiveFolderId: string
): Promise<string> {
  return promiseRetry(
    retry => getUploadFolderWorker(auth, archiveFolderId).catch(retry),
    RETRY_OPTIONS
  );
}

/**
 * Create the Fusion Tables subfolder for an export
 */
async function getUploadFolderWorker(
  auth: OAuth2Client,
  archiveFolderId: string
): Promise<string> {
  try {
    const response = await drive.files.create({
      auth,
      resource: {
        name: getDriveSubfolderName(),
        parents: [archiveFolderId],
        mimeType: MIME_TYPES.folder
      }
    } as drive_v3.Params$Resource$Files$Create);

    if (response.statusText !== 'OK') {
      throw new Error(`Cannot create a new subfolder: ${response.statusText}`);
    }

    return response.data.id as string;
  } catch (error) {
    throw error;
  }
}

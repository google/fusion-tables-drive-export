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
  DRIVE_ARCHIVE_FOLDER,
  MIME_TYPES,
  RETRY_OPTIONS
} from '../config/config';
import findFile from './find-file';

const drive = google.drive('v3');

/**
 * Get the ID for the Fusion Tables Archive folder
 */
export default async function(auth: OAuth2Client): Promise<string> {
  try {
    const archiveFolderId = await findFile(auth, DRIVE_ARCHIVE_FOLDER, 'root');

    if (archiveFolderId) {
      return archiveFolderId;
    }

    return createArchiveFolder(auth);
  } catch (error) {
    throw error;
  }
}

/**
 * Wrapper around the actual function with exponential retries
 */
function createArchiveFolder(auth: OAuth2Client): Promise<string> {
  return promiseRetry(
    retry => createArchiveFolderWorker(auth).catch(retry),
    RETRY_OPTIONS
  );
}

/**
 * Create the Fusion Tables Archive folder
 */
async function createArchiveFolderWorker(auth: OAuth2Client): Promise<string> {
  try {
    const response = await drive.files.create({
      auth,
      resource: {
        name: DRIVE_ARCHIVE_FOLDER,
        mimeType: MIME_TYPES.folder
      }
    } as drive_v3.Params$Resource$Files$Create);

    if (response.statusText !== 'OK') {
      throw new Error(`Cannot create archive folder: ${response.statusText}`);
    }

    return response.data.id as string;
  } catch (error) {
    throw error;
  }
}

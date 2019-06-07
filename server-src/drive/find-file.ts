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
  try {
    const response = await drive.files.list({
      auth,
      q: `name='${name}' and '${parentId}' in parents and trashed = false`
    });
    const files = response.data.files;

    if (files && files.length > 0 && files[0].id) {
      return files[0].id;
    }
  } catch (error) {
    throw error;
  }

  return null;
}

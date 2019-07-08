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

import {Readable} from 'stream';
import {Buffer} from 'buffer';
import {google} from 'googleapis';
import fetch from 'node-fetch';
import {OAuth2Client} from 'google-auth-library';
import {MIME_TYPES, FIVE_MB} from '../config/config';
import {ICsv} from '../interfaces/csv';
import {IFile} from '../interfaces/file';

const drive = google.drive('v3');

/**
 * Upload the CSV
 */
export default async function(
  auth: OAuth2Client,
  folderId: string,
  csv: ICsv
): Promise<IFile> {
  const contentLength = Buffer.byteLength(csv.data, 'utf8');

  if (csv.hasLargeCells || contentLength > FIVE_MB) {
    try {
      return uploadCsv({auth, csv, folderId});
    } catch (error) {
      throw error;
    }
  }

  try {
    const file = uploadSpreadsheet({auth, csv, folderId});
    return file;
  } catch (ignoredError) {
    try {
      return uploadCsv({auth, csv, folderId});
    } catch (error) {
      throw error;
    }
  }
}

/**
 * Upload the CSV as a Spreadsheet
 */
async function uploadSpreadsheet({
  auth,
  csv,
  folderId
}: {
  auth: OAuth2Client;
  csv: ICsv;
  folderId: string;
}): Promise<IFile> {
  const stream = new Readable();
  stream._read = () => {
    return;
  };
  stream.push(csv.data);
  stream.push(null);

  try {
    const file = await drive.files.create({
      auth,
      requestBody: {
        mimeType: MIME_TYPES.spreadsheet,
        name: `ft-${csv.name}`,
        parents: [folderId]
      },
      media: {
        mimeType: MIME_TYPES.csv,
        body: stream
      }
    });

    if (!file.data.id || !file.data.name || !file.data.mimeType) {
      throw new Error('Failed to upload the file to Drive.');
    }

    return {
      id: file.data.id,
      name: file.data.name,
      mimeType: file.data.mimeType
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Upload the CSV as a CSV via a resumable upload
 */
async function uploadCsv({
  auth,
  csv,
  folderId
}: {
  auth: OAuth2Client;
  csv: ICsv;
  folderId: string;
}): Promise<IFile> {
  const contentLength = Buffer.byteLength(csv.data, 'utf8');
  const metaData = JSON.stringify({
    name: `ft-${csv.name}`,
    parents: [folderId]
  });

  try {
    const token = await auth.getAccessToken();

    const metaResponse = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable',
      {
        method: 'post',
        body: metaData,
        headers: {
          Authorization: `Bearer ${token.token}`,
          'Content-Type': 'application/json; charset=UTF-8',
          'Content-Length': String(Buffer.byteLength(metaData, 'utf8')),
          'X-Upload-Content-Type': MIME_TYPES.csv,
          'X-Upload-Content-Length': String(contentLength)
        }
      }
    );

    const uploadUri = metaResponse.headers.get('Location');

    if (metaResponse.status !== 200 || !uploadUri) {
      throw new Error('Failed to upload the file to Drive.');
    }

    const response = await fetch(uploadUri, {
      method: 'put',
      body: csv.data,
      headers: {
        'Content-Type': MIME_TYPES.csv,
        'Content-Length': String(contentLength)
      }
    });

    const fileData = await response.json();

    return {
      id: fileData.id,
      name: fileData.name,
      mimeType: fileData.name
    };
  } catch (error) {
    throw error;
  }
}

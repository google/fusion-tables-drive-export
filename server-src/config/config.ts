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
import {OperationOptions} from 'retry';

export const DRIVE_ARCHIVE_FOLDER = 'ft-archive';
export const DRIVE_ARCHIVE_INDEX_SHEET = 'ft-archive-index';

export const getDriveSubfolderName = () => {
  const now = new Date();
  const Y = now.getFullYear();
  const M = String(now.getMonth() + 1).padStart(2, '0');
  const D = String(now.getDate()).padStart(2, '0');
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');

  return `export-${Y}${M}${D}-${h}${m}`;
};

export const MIME_TYPES = {
  csv: 'text/csv',
  spreadsheet: 'application/vnd.google-apps.spreadsheet',
  folder: 'application/vnd.google-apps.folder'
};

export const IS_LARGE_TRESHOLD = 50000000; // chars
export const FIVE_MB = 5 * 1024 * 1024;

export const TABLES_PER_PAGE = 100;

export const VISUALIZER_BASE_URI = process.env.VISUALIZER_BASE_URI;

export const RETRY_OPTIONS: OperationOptions = {
  retries: 6
};

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

import promiseRetry from 'promise-retry';
import datastore, {retryOptions} from './datastore';
import {Credentials} from 'google-auth-library';
import hashCredentials from '../lib/hash-credentials';

/**
 * Wrapper around the actual function with exponential retries
 */
export default function isAuthorized(
  exportId: string,
  credentials: Credentials
): Promise<boolean> {
  return promiseRetry(
    retry => isAuthorizedWorker(exportId, credentials).catch(retry),
    retryOptions
  );
}

/**
 * Check whether an user is autheticated for that export
 */
async function isAuthorizedWorker(
  exportId: string,
  credentials: Credentials
): Promise<boolean> {
  try {
    const key = datastore.key(['Export', exportId]);
    const [fusiontableExport] = await datastore.get(key);

    return (
      fusiontableExport &&
      fusiontableExport.credentials &&
      fusiontableExport.credentials === hashCredentials(credentials)
    );
  } catch (error) {
    return false;
  }
}

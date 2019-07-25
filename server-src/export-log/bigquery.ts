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

import {BigQuery, Table} from '@google-cloud/bigquery';

const bigquery = new BigQuery();
const dataset = bigquery.dataset('fusiontables');
let table: Table | null = null;
let initialized = false;

init();

interface LogData {
  type: string;
  event: string;
  userId: string;
  exportId: string;
  tableId?: string;
  tableStatus?: string;
  tableCount?: number;
  exportedFileSize?: number;
}

/**
 * Insert something into the BigQuery log table
 */
export default async function logData(data: LogData): Promise<void> {
  if (!initialized || !table) {
    throw new Error('Database is not initialized.');
  }

  try {
    await table.insert({
      ...data,
      time: Date.now() / 1000
    });
  } catch (error) {
    throw error;
  }

  return;
}

/**
 * Initialize the dataset and table if they don’t exist
 */
async function init(): Promise<void> {
  try {
    const [datasetExists] = await dataset.exists();
    if (!datasetExists) {
      await dataset.create();
      console.info('• Created BigQuery dataset ’fusiontables’.');
    }

    table = dataset.table('export_log');
    const [tableExists] = await table.exists();
    if (!tableExists) {
      await table.create({
        schema: [
          'type:string',
          'event:string',
          'userId:string',
          'exportId:string',
          'tableId:string',
          'tableCount:integer',
          'tableStatus:string',
          'exportedFileSize:integer',
          'time:timestamp'
        ].join(',')
      });
      console.info('• Created BigQuery table ’export_log’.');
    }

    initialized = true;
  } catch (error) {
    throw error;
  }
}

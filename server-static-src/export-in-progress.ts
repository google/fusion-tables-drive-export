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

import {ITableExport} from '../server-src/interfaces/table-export';

const renderedTableExports: string[] = [];
let exportId: string;
let alreadyShowingMultipleVisualizationsNote = false;

/* tslint:disable prefer-for-of */

/**
 * Add loading symbol to the list
 */
const $fusiontables = document.querySelectorAll('.fusiontable--export');
for (let i = 0; i < $fusiontables.length; ++i) {
  $fusiontables[i].setAttribute('loading', 'true');
}

/**
 * Request updates from the server export progress
 */
if (document.querySelectorAll('.fusiontable[loading]').length > 0) {
  exportId = document
    .querySelector('.fusiontable-export')
    .getAttribute('data-export-id');
  requestUpdates();
}

function requestUpdates() {
  const request = new XMLHttpRequest();
  request.open('GET', '/export/' + exportId + '/updates', true);
  request.onload = function() {
    let recheck = false;

    if (this.status >= 200 && this.status < 400) {
      const tableExports: ITableExport[] = JSON.parse(this.response);
      recheck = tableExports.some(
        tableExport => tableExport.status === 'loading'
      );

      tableExports
        .filter(
          tableExport =>
            tableExport.status !== 'loading' &&
            renderedTableExports.indexOf(tableExport.tableId) === -1
        )
        .forEach(updateTable);
    } else {
      recheck = true;
    }

    if (recheck) {
      setTimeout(requestUpdates, 4000);
    }
  };
  request.onerror = requestUpdates;
  request.send();
}

/**
 * Update the Fusion Table in the list
 */
function updateTable(data: ITableExport) {
  if (!data) {
    return;
  }

  const $listEntry = document.querySelector(
    '.fusiontable[data-id="' + data.tableId + '"]'
  );

  if (!$listEntry) {
    return;
  }

  $listEntry.removeAttribute('loading');
  renderedTableExports.push(data.tableId);

  if (data.error) {
    $listEntry.innerHTML += `
      <div class="fusiontable__error">
        <div class="fusiontable__error__message">
          ${data.error}
        </div>
      </div>`;
  }

  if (!data.driveFile) {
    $listEntry.classList.add(`fusiontable--failed`);
    return;
  }

  const {id, name, mimeType} = data.driveFile;
  const type =
    mimeType === 'application/vnd.google-apps.spreadsheet'
      ? 'Spreadsheet'
      : 'CSV';
  const driveUrl = `https://drive.google.com/open?id=${id}`;
  const driveTitle = `Open ${name} ${type}`;
  const $driveLink = $listEntry.querySelector('.fusiontable__link--file');
  const $visualization = $listEntry.querySelector(
    '.fusiontable__visualization'
  );

  $listEntry.classList.add(`fusiontable--${type.toLowerCase()}`);
  $driveLink.setAttribute('href', driveUrl);
  $driveLink.setAttribute('title', driveTitle);

  if (data.hasGeometryData) {
    if (data.styles.length > 0) {
      data.styles.forEach(style =>
        renderVisualizationLink($visualization, id, name, style)
      );

      if (data.styles.length > 1) {
        renderMultipleVisualizationsNote();
      }
    } else {
      renderVisualizationLink($visualization, id, name);
    }
  } else {
    $visualization.classList.add('fusiontable__visualization--not-available');
  }

  if (data.isLarge) {
    $visualization.classList.add('fusiontable__visualization--is-large');
  }
}

/**
 * Render a note that there are multiple visualizations
 */
function renderMultipleVisualizationsNote() {
  if (alreadyShowingMultipleVisualizationsNote) {
    return;
  }

  alreadyShowingMultipleVisualizationsNote = true;

  const $header = document.querySelector('.fusiontable--header');

  const $container = document.createElement('div');
  $container.className = 'fusiontable__note';

  const $message = document.createElement('div');
  $message.className = 'fusiontable__note__message';
  $message.textContent =
    'Some fusion tables have multiple styling ' +
    'configurations. A visualization has been created for each one, along ' +
    'with a corresponding row in the index sheet.';
  $container.appendChild($message);

  $header.parentNode.insertBefore($container, $header);
}

/**
 * Get the link to a visualization
 */
function renderVisualizationLink(
  $visualization: Element,
  id: string,
  name: string,
  style?: string
): void {
  let url = `https://geoviz-dot-fusion-tables-export.appspot.com/#file=${id}`;

  if (style) {
    url += `&style=${style}`;
  }

  const markup = `
    <a class="unflashy fusiontable__link fusiontable__link--visualization"
      href="${url}"
      title="Open ${name} visualization"
      target="_blank" rel="noopener">
      <svg>
        <use xlink:href="#icon-map"></use>
      </svg>
    </a>
  `;

  $visualization.innerHTML += markup;
}

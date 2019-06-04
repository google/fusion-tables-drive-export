import {ITableExport} from '../server-src/interfaces/table-export';

let exportId: string;
const renderedTableExports: string[] = [];

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
            renderedTableExports.indexOf(tableExport.table.id) === -1
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
    '.fusiontable[data-id="' + data.table.id + '"]'
  );

  if (!$listEntry) {
    return;
  }

  $listEntry.removeAttribute('loading');
  renderedTableExports.push(data.table.id);

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
 * Get the link to a visualization
 */
function renderVisualizationLink(
  $visualization: Element,
  id: string,
  name: string,
  style?: string
): void {
  let url =
    'https://storage.googleapis.com/fusion-tables-export.appspot.com/' +
    `index.html#file=${id}`;

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

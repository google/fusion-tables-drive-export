import {ITableExport} from '../server-src/interfaces/table-export';

const exportId: string = document
  .querySelector('.fusiontable-export')
  .getAttribute('data-export-id');
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
  requestUpdates();
}

function requestUpdates() {
  const request = new XMLHttpRequest();
  request.open('GET', '/export/updates/' + exportId, true);
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
            !renderedTableExports.includes(tableExport.table.id)
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
  console.log('RENDER!', data);

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

  if (data.driveFile) {
    const {id, name, mimeType} = data.driveFile;
    const type =
      mimeType === 'application/vnd.google-apps.spreadsheet'
        ? 'Spreadsheet'
        : 'CSV';
    const driveUrl = `https://drive.google.com/open?id=${id}`;
    const driveTitle = `Open ${name} ${type}`;
    const visualizationUrl = `/visualizer/#file=${id}`;
    const visualizationTitle = `Open ${name} visualization`;
    const $driveLink = $listEntry.querySelector('.fusiontable__link--file');
    const $visualizationLink = $listEntry.querySelector(
      '.fusiontable__link--visualization'
    );

    $listEntry.classList.add(`fusiontable--${type.toLowerCase()}`);
    $driveLink.setAttribute('href', driveUrl);
    $driveLink.setAttribute('title', driveTitle);
    $visualizationLink.setAttribute('href', visualizationUrl);
    $visualizationLink.setAttribute('title', visualizationTitle);
  } else {
    $listEntry.classList.add(`fusiontable--failed`);
  }
}

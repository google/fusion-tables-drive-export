import {ITableFinishedEmitterData} from '../server-src/interfaces/table-finished-emitter-data';

/**
 * Add loading symbol to the list
 */
[...document.querySelectorAll('.fusiontable--export')].forEach($table => {
  $table.setAttribute('loading', 'true');
});

/**
 * Request updates from the server export progress
 */
if (document.querySelectorAll('.fusiontable[loading]').length > 0) {
  requestUpdates();
}

function requestUpdates() {
  const request = new XMLHttpRequest();
  request.open('GET', '/export/updates', true);
  request.onload = function() {
    if (this.status >= 200 && this.status < 400) {
      const data: ITableFinishedEmitterData = JSON.parse(this.response);
      updateTable(data);
    }

    requestUpdates();
  };
  request.onerror = requestUpdates;
  request.send();
}

/**
 * Update the Fusion Table in the list
 */
function updateTable(data: ITableFinishedEmitterData) {
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

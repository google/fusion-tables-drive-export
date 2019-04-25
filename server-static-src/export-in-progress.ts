import {ITableFinishedEmitterData} from '../server-src/interfaces/table-finished-emitter-data';

/**
 * Add loading symbol to the list
 */
document.querySelectorAll('.fusiontable').forEach($table => {
  $table.classList.add('fusiontable--loading');
});

/**
 * Request updates from the server export progress
 */
if (document.querySelectorAll('.fusiontable--loading').length > 0) {
  requestUpdates();
}

function requestUpdates() {
  const request = new XMLHttpRequest();
  request.open('GET', '/export/updates', true);
  request.onload = function() {
    if (this.status >= 200 && this.status < 400) {
      const data = JSON.parse(this.response);
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

  $listEntry.classList.remove('fusiontable--loading');
  if (data.error) {
    $listEntry.classList.add('fusiontable--error');
  } else {
    $listEntry.classList.add('fusiontable--success');
  }

  if (data.driveFile) {
    const {id, name, mimeType} = data.driveFile;
    const type = mimeType === 'application/vnd.google-apps.spreadsheet'
        ? 'Spreadsheet'
        : 'CSV';
    const driveLink =
      `&emsp;
      <a href="https://drive.google.com/open?id=${id}"
        title="Open ${name} ${type}" target="_blank">
        <small>Open ${type}</small>
      </a>`;
    const visualizerLink =
      `&emsp;
      <a href="/visualizer/#file=${id}" title="Open ${name} visualization"
        target="_blank">
        <small>Open Visualization</small>
      </a>`;

    $listEntry.innerHTML += driveLink + ', ' + visualizerLink;
  }
}

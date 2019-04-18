/**
 * Add loading symbol to the list
 */
document.querySelectorAll('.fusiontable').forEach(function($table) {
  $table.classList.add('fusiontable--loading');
});

/**
 * Request updates from the server export progress
 */
(function requestUpdates() {
  if (document.querySelectorAll('.fusiontable--loading').length === 0) {
    return;
  }

  var request = new XMLHttpRequest();
  request.open('GET', '/export/updates', true);
  request.onload = function() {
    if (this.status >= 200 && this.status < 400) {
      var data = JSON.parse(this.response);
      updateTable(data);
    }

    requestUpdates();
  };
  request.onerror = requestUpdates;
  request.send();
})();

/**
 * Update the Fusion Table in the list
 */
function updateTable(data) {
  if (!data) {
    return;
  }

  var $listEntry = document.querySelector(
    '.fusiontable[data-id="' + data.table.id + '"]'
  );

  $listEntry.classList.remove('fusiontable--loading');
  if (data.error) {
    $listEntry.classList.add('fusiontable--error');
  } else {
    $listEntry.classList.add('fusiontable--success');
  }

  if (data.driveFile) {
    var type =
      data.driveFile.mimeType === 'application/vnd.google-apps.spreadsheet'
        ? 'Spreadsheet'
        : 'CSV';
    var driveLink =
      '&emsp;<a href="https://drive.google.com/open?id=' +
      data.driveFile.id +
      '" title="Open ' +
      data.driveFile.name +
      ' ' +
      type +
      '" target="_blank"><small>Open ' +
      type +
      '</small></a>';
    var visualizerLink =
      '&emsp;<a href="/visualizer/#file=' +
      data.driveFile.id +
      '" title="Open ' +
      data.driveFile.name +
      ' visualization" target="_blank"><small>Open Visualization</small></a>';

    $listEntry.innerHTML += driveLink + ', ' + visualizerLink;
  }
}

var source = new EventSource('/export/updates');

source.onopen = function() {
  document.querySelectorAll('.fusiontable').forEach(function($table) {
    $table.classList.add('fusiontable--loading');
  });
};

source.addEventListener(
  'message',
  function(event) {
    var data = JSON.parse(event.data);

    if (!data) {
      return;
    }

    var $listEntry = document.querySelector(
      '.fusiontable[data-id="' + data.table.id + '"]'
    );

    $listEntry.classList.remove('fusiontable--loading');
    $listEntry.classList.add('fusiontable--success');

    var type =
      data.driveFile.mimeType === 'application/vnd.google-apps.spreadsheet'
        ? 'Spreadsheet'
        : 'CSV';
    var driveLink =
      '&emsp;<a href="https://docs.google.com/spreadsheets/d/' +
      data.driveFile.id +
      '/" title="Open ' +
      data.driveFile.name +
      ' ' +
      type +
      '" target="_blank"><small>Open ' +
      type +
      '</small></a>';

    $listEntry.innerHTML += driveLink;
  },
  false
);

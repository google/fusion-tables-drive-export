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

    var driveLink = '';

    if (data.driveFile.mimeType === 'application/vnd.google-apps.spreadsheet') {
      driveLink =
        '&emsp;<a href="https://docs.google.com/spreadsheets/d/' +
        data.driveFile.id +
        '/" title="Open ' +
        data.driveFile.name +
        ' Spreadsheet" target="_blank"><small>Open Spreadsheet</small></a>';
    } else {
      driveLink =
        '&emsp;<a href="https://drive.google.com/open?id=' +
        data.driveFile.id +
        '" title="Open ' +
        data.driveFile.name +
        ' CSV" target="_blank"><small>Open CSV</small></a>';
    }

    $listEntry.innerHTML += driveLink;
  },
  false
);

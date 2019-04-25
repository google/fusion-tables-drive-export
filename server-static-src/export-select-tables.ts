const $exportAll: HTMLInputElement = document.querySelector('#export-all');
let $exportChecks: NodeListOf<HTMLInputElement>;

if ($exportAll) {
  $exportChecks = document.querySelectorAll('.checkbox-row__input');
  $exportAll.addEventListener('change', handleExportAllChange);
  $exportChecks.forEach($exportCheck =>
    $exportCheck.addEventListener('change', handlexportCheckChange)
  );
}

/**
 * Handle change of the exportAll input
 */
function handleExportAllChange() {
  $exportChecks.forEach(
    $exportCheck => ($exportCheck.checked = $exportAll.checked)
  );
}

/**
 * Handle change of an export input checkbox
 */
function handlexportCheckChange() {
  let allChecked = true;

  $exportChecks.forEach($exportCheck => {
    if (!$exportCheck.checked) {
      allChecked = false;
    }
  });

  $exportAll.checked = allChecked;
}

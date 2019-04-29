const $exportAll: HTMLInputElement = document.querySelector('#export-all');
let $exportChecks: NodeListOf<HTMLInputElement>;

/* tslint:disable prefer-for-of */

if ($exportAll) {
  $exportChecks = document.querySelectorAll('.checkbox-row__input');
  $exportAll.addEventListener('change', handleExportAllChange);
  for (let i = 0; i < $exportChecks.length; ++i) {
    $exportChecks[i].addEventListener('change', handlexportCheckChange);
  }
}

/**
 * Handle change of the exportAll input
 */
function handleExportAllChange() {
  for (let i = 0; i < $exportChecks.length; ++i) {
    $exportChecks[i].checked = $exportAll.checked;
  }
}

/**
 * Handle change of an export input checkbox
 */
function handlexportCheckChange() {
  let allChecked = true;

  for (let i = 0; i < $exportChecks.length; ++i) {
    if (!$exportChecks[i].checked) {
      allChecked = false;
    }
    $exportChecks[i].checked = $exportAll.checked;
  }

  $exportAll.checked = allChecked;
}

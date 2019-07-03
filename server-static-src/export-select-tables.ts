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

const $nameFilterInput: HTMLInputElement = document.querySelector(
  '.input__field'
);
const $nameFilterClear: HTMLAnchorElement = document.querySelector(
  '.input__clear'
);
const $exportAll: HTMLInputElement = document.querySelector('#export-all');
const $exportButton: HTMLButtonElement = document.querySelector(
  '#export-button'
);
let $exportChecks: NodeListOf<HTMLInputElement>;

/* tslint:disable prefer-for-of */

if ($nameFilterInput) {
  $nameFilterInput.addEventListener('input', handleNameFilterInputChange);
  handleNameFilterInputChange();
}

if ($exportAll && $exportButton) {
  $exportChecks = document.querySelectorAll('.checkbox-row__input');
  $exportAll.addEventListener('change', handleExportAllChange);
  for (let i = 0; i < $exportChecks.length; ++i) {
    $exportChecks[i].addEventListener('change', handlexportCheckChange);
  }
  setExportButtonState();

  /**
   * Track amount of shown tables
   */
  if ($exportChecks.length > 0) {
    window.gtag('event', 'show', {
      event_category: 'Export',
      event_label: 'tableCount',
      value: $exportChecks.length
    });
  }
}

/**
 * When the input changed
 */
function handleNameFilterInputChange() {
  const hasContent = Boolean($nameFilterInput.value);
  if (hasContent) {
    $nameFilterClear.classList.remove('invisible');
  } else {
    $nameFilterClear.classList.add('invisible');
  }
}

/**
 * Handle change of the exportAll input
 */
function handleExportAllChange() {
  for (let i = 0; i < $exportChecks.length; ++i) {
    $exportChecks[i].checked = $exportAll.checked;
  }

  setExportButtonState();
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
  }

  $exportAll.checked = allChecked;
  setExportButtonState();
}

/**
 * Set the state of the export button according the list state
 */
function setExportButtonState() {
  let someChecked = false;

  for (let i = 0; i < $exportChecks.length; ++i) {
    if ($exportChecks[i].checked) {
      someChecked = true;
    }
  }

  if (someChecked) {
    $exportButton.removeAttribute('disabled');
  } else {
    $exportButton.setAttribute('disabled', 'disabled');
  }
}

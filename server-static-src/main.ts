import './export-select-tables';
import './export-in-progress';
import './main.styl';

document.body.classList.remove('no-js');

/* tslint:disable prefer-for-of */

const $buttons = document.querySelectorAll('.button');
for (let i = 0; i < $buttons.length; ++i) {
  const $button = $buttons[i];
  $button.addEventListener('click', () => {
    $button.classList.add('button--loading');
  });
}

import {Deck} from '@deck.gl/core';
import {INITIAL_VIEW_STATE} from './config';
import initOverlay from './init-overlay';

/**
 * Initialize Deck.gl on the Google Map
 */
export default function initDeck(map: google.maps.Map): Deck {
  const canvasEl = document.createElement('canvas');
  const mapEl = map.getDiv();
  const {clientWidth, clientHeight} = mapEl;
  canvasEl.width = clientWidth;
  canvasEl.height = clientHeight;
  canvasEl.style.position = 'absolute';

  const deck = new Deck({
    canvas: canvasEl,
    width: canvasEl.width,
    height: canvasEl.height,
    initialViewState: INITIAL_VIEW_STATE,
    // Google maps has no rotating capabilities, so we disable rotation here.
    controller: {
      scrollZoom: false,
      dragPan: false,
      dragRotate: false,
      doubleClickZoom: false,
      touchZoom: false,
      touchRotate: false,
      keyboard: false
    },
    layers: []
  });

  initOverlay(map, deck);

  return deck;
}

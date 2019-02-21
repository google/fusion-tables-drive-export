import initMap from './init-google-maps';
import initDeckGl from './init-deck-gl';
import initOverlay from './init-overlay';

(async () => {
  const map = await initMap();
  const deck = initDeckGl(map);
  initOverlay(map, deck);

  // addGoogleMarkers(map, randomPointsGoogle);
  // addDeckListeners(deck);

  // frame = (frame + 0.1) % 400;
  // deck.setProps({layers: getLayers(frame)})
})();

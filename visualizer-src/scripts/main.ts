import initMap from './init-google-maps';
import initDeckGl from './init-deck-gl';
import initOverlay from './init-overlay';
import initAuth from './init-google-auth';
import fetchData from './fetch-data';

(async () => {
  const map = await initMap();
  const deck = initDeckGl(map);
  initOverlay(map, deck);

  await initAuth();
  document.getElementById('signin').style.display = 'none';

  const data = await fetchData();
  console.log(data);

  // addGoogleMarkers(map, randomPointsGoogle);
  // addDeckListeners(deck);

  // frame = (frame + 0.1) % 400;
  // deck.setProps({layers: getLayers(frame)})
})();

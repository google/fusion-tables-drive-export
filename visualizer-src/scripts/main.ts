import initMap from './init-google-maps';
import initDeckGl from './init-deck-gl';
import initAuth from './init-google-auth';
import fetchData from './fetch-data';
import deckGlGeojsonLayer from './deck-gl-geojson-layer';
import initInfowindow from './init-infowindow';

(async () => {
  const map = await initMap();
  const deck = initDeckGl(map);
  initInfowindow(map, deck);

  await initAuth();
  document.getElementById('signin').style.display = 'none';

  const data = await fetchData();

  if (!data) {
    return;
  }

  const geojsonLayer = deckGlGeojsonLayer(data);
  deck.setProps({layers: [geojsonLayer as any]});
})();

import initMap from './init-google-maps';
import initDeckGl from './init-deck-gl';
import initAuth from './init-google-auth';
import fetchData from './fetch-data';
import deckGlGeojsonLayer from './deck-gl-geojson-layer';
import { Layer } from 'deck.gl';

(async () => {
  const map = await initMap();
  const deck = initDeckGl(map);

  await initAuth();
  document.getElementById('signin').style.display = 'none';

  const data = await fetchData();
  const layers = [deckGlGeojsonLayer(data) as any];
  deck.setProps({layers});
})();

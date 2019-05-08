import initMap from './init-google-maps';
import initDeckGl from './init-deck-gl';
import initAuth from './init-google-auth';
import getParamsFromHash from './get-params-from-hash';
import fetchData from './fetch-data';
import deckGlGeojsonLayer from './deck-gl-geojson-layer';
import initInfowindow from './init-infowindow';
import {IStyle} from '../../server-src/interfaces/style';

(async () => {
  const map = await initMap();
  const deck = initDeckGl(map);
  initInfowindow(map, deck);

  await initAuth();
  document.getElementById('signin').style.display = 'none';

  const params = getParamsFromHash();

  if (!params.file) {
    return;
  }

  const data = await fetchData(params.file);

  if (!data) {
    return;
  }

  const geojsonLayer = deckGlGeojsonLayer(data, params.style as IStyle);
  deck.setProps({layers: [geojsonLayer as any]});
})();

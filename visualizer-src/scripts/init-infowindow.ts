import {Deck} from 'deck.gl';
import {LAYER_ID} from './config';

/**
 * Initialize an infowindow that shows the clicked data
 */
export default function(map: google.maps.Map, deck: Deck): void {
  map.addListener('mousemove', event => {
    if (!(deck as any).layerManager) {
      return;
    }

    const {x, y} = event.pixel;
    const picked = deck.pickObject({x, y, radius: 0, layerIds: [LAYER_ID]});
    document.body.classList.toggle('cursor-pointer', picked);
  });

  map.addListener('click', event => {
    const {latLng, pixel} = event;
    const {x, y} = pixel;
    const picked = deck.pickObject({x, y, radius: 4, layerIds: [LAYER_ID]});

    if (picked) {
      openInfowindow(infowindow, map, picked.object, latLng);
    } else {
      infowindow.close();
    }
  });

  const infowindow = new google.maps.InfoWindow({
    content: '',
    maxWidth: 400
  });
}

/**
 * Open the Tooltip for the passed in object
 */
function openInfowindow(
  infowindow: google.maps.InfoWindow,
  map: google.maps.Map,
  feature: GeoJSON.Feature,
  position: google.maps.LatLng
) {
  if (!feature || !map || !position) {
    return;
  }

  infowindow.setContent(JSON.stringify(feature.properties));
  infowindow.setPosition(position);
  infowindow.open(map);
}

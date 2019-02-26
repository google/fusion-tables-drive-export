import {Deck} from 'deck.gl';
import {LAYER_ID} from './config';

/**
 * Initialize an infowindow that shows the clicked data
 */
export default function(map: google.maps.Map, deck: Deck): void {
  const dummyOverlay = createDummyOverlay(map);

  window.addEventListener('mousemove', event => {
    if (!(deck as any).layerManager) {
      return;
    }

    const {clientX: x, clientY: y} = event;
    const picked = deck.pickObject({x, y, radius: 0, layerIds: [LAYER_ID]});
    document.body.classList.toggle('cursor-pointer', picked);
  });

  window.addEventListener('click', event => {
    const {clientX: x, clientY: y} = event;
    // PREVENT BUBBLING WHEN NOT CLICKING MAP
    const picked = deck.pickObject({x, y, radius: 4, layerIds: [LAYER_ID]});

    if (picked) {
      const position = dummyOverlay
        .getProjection()
        .fromContainerPixelToLatLng(new google.maps.Point(x, y));
      openInfowindow(infowindow, map, picked.object, position);
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

/**
 * Create a dummy overlay to calculate the position
 */
function createDummyOverlay(map: google.maps.Map): google.maps.OverlayView {
  if (!map) {
    return;
  }

  function Dummy(internalMap: google.maps.Map) {
    this.setMap(internalMap);
  }

  Dummy.prototype = new google.maps.OverlayView();
  Dummy.prototype.draw = () => undefined;
  Dummy.prototype.onAdd = () => undefined;
  Dummy.prototype.onRemove = () => undefined;

  return new Dummy(map);
}

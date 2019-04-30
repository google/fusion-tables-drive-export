import {GeoJsonLayer} from '@deck.gl/layers';
import {LAYER_ID} from './config';

/**
 * Create a GeoJSON layer from the data
 * Converts the WKT data to GeoJSON
 */
export default function(data: string[][]): GeoJsonLayer {
  return new GeoJsonLayer({
    id: LAYER_ID,
    data: createGeojsonFromData(data),
    pickable: true,
    stroked: true,
    filled: true,
    lineWidthMinPixels: 1,
    pointRadiusMinPixels: 3,
    getFillColor: [239, 83, 80, 97],
    getLineColor: [239, 83, 80, 214],
    getRadius: 100
  });
}

/**
 * Create a GeoJSON FeatureCollection from the source data
 */
function createGeojsonFromData(
  data: string[][]
): GeoJSON.FeatureCollection<GeoJSON.GeometryObject> {
  const featureCollection: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: []
  };

  const columns = data[0];
  const geometryIndex = columns.indexOf('geometry');

  if (!geometryIndex) {
    return null;
  }

  data.forEach((row, index) => {
    if (index === 0) {
      return;
    }

    const geoJsonFeature = getGeoJsonWithProperties(
      row[geometryIndex],
      columns,
      row
    );

    if (geoJsonFeature) {
      featureCollection.features.push(geoJsonFeature);
    }
  });

  return featureCollection;
}

/**
 * Convert the WKT to GeoJSON.
 * As there might be the feature wrapper missing, add it.
 */
function getGeoJsonWithProperties(
  geoJsonString: string,
  columns: string[],
  row: string[]
): GeoJSON.Feature<any> {
  if (!geoJsonString) {
    return;
  }

  const geoJson = JSON.parse(geoJsonString) as GeoJSON.Feature<any>;
  geoJson.properties = columns.reduce(
    (all: {[name: string]: any}, current: string, currentIndex: number) => {
      if (current === 'geometry') {
        return all;
      }

      all[current] = row[currentIndex] || '';

      return all;
    },
    {}
  );

  return geoJson;
}

import {GeoJsonLayer} from '@deck.gl/layers';
import wkx from 'wkx';

/**
 * Create a GeoJSON layer from the data
 * Converts the WKT data to GeoJSON
 */
export default function(data: string[][]): GeoJsonLayer {
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

    const geoJsonFeature = getGeoJsonFromWkt(row[geometryIndex], columns, row);

    if (geoJsonFeature) {
      featureCollection.features.push(geoJsonFeature);
    }
  });

  return new GeoJsonLayer({
    id: 'geojson-layer',
    data: featureCollection,
    pickable: true,
    stroked: true,
    filled: true,
    lineWidthMinPixels: 1,
    pointRadiusMinPixels: 3,
    getFillColor: [217, 236, 236, 125],
    getRadius: 100
    // onHover: ({object, x, y}) => {
    //   const tooltip = object.properties.name || object.properties.station;
    // }
  });
}

/**
 * Convert the WKT to GeoJSON.
 * As there might be the feature wrapper missing, add it.
 */
function getGeoJsonFromWkt(
  wkt: string,
  columns: string[],
  row: string[]
): GeoJSON.Feature<any> {
  if (!wkt) {
    return;
  }

  const geoJson = wkx.Geometry.parse(wkt).toGeoJSON() as GeoJSON.GeometryObject;

  return {
    type: 'Feature',
    geometry: geoJson,
    properties: columns.reduce(
      (all: {[name: string]: any}, current: string, currentIndex: number) => {
        if (current === 'geometry') {
          return all;
        }

        all[current] = row[currentIndex] || '';

        return all;
      },
      {}
    )
  };
}

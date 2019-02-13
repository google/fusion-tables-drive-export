const types = [
  'Point',
  'Polygon',
  'LineString',
  'MultiPoint',
  'MultiPolygon',
  'MultiLineString',
  'GeometryCollection',
  'Feature',
  'FeatureCollection'
];

/**
 * Check whether the passed in value is a GeoJSON or not
 */
export default function(value: any): boolean {
  if (
    !value ||
    typeof value !== 'object' ||
    (!value.type && !value.geometry) ||
    (!value.type && !value.geometry.type) ||
    (value.type && !types.includes(value.type))
  ) {
    return false;
  }

  return true;
}

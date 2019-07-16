/*!
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {DOMParser} from 'xmldom';
import {kml as kml2GeoJson} from '@tmcw/togeojson';

/**
 * Convert all Geo things to WKT
 */
export default function convertKmlToGeoJson(json: any[]): any[] {
  return json
    .filter(row => row)
    .map(row => {
      return row.map((cell: any) => {
        try {
          const geoJson = convertToGeoJson(cell);
          return geoJson || cell;
        } catch (error) {
          return cell;
        }
      });
    });
}

/**
 * Convert a value to GeoJSON or return null if not possible
 */
function convertToGeoJson(value: any): string | null {
  if (value.startsWith && !value.startsWith('<')) {
    return null;
  }

  if (value.startsWith('<Polygon><outerBoundaryIs><coordinates>')) {
    value = value.replace(
      /<Polygon><outerBoundaryIs><coordinates>/g,
      '<Polygon><outerBoundaryIs><LinearRing><coordinates>'
    );
    value = value.replace(
      /<\/coordinates><\/outerBoundaryIs><\/Polygon>/gi,
      '</coordinates></LinearRing></outerBoundaryIs></Polygon>'
    );
  }

  const kmlString = `<?xml version="1.0" encoding="UTF-8"?>
    <kml xmlns="http://www.opengis.net/kml/2.2">
      <Placemark>
        ${value}
      </Placemark>
    </kml>`;

  const kmlDom = new DOMParser().parseFromString(kmlString, 'text/xml');
  const geoJson = kml2GeoJson(kmlDom);

  if (!geoJson.features || geoJson.features.length === 0) {
    return null;
  }

  const feature: GeoJSON.Feature = geoJson.features[0];
  feature.geometry = fixCoordinates(feature.geometry);
  return JSON.stringify(feature);
}

/**
 * Fix the coordinates for polygons
 */
function fixCoordinates(geometry: GeoJSON.Geometry): GeoJSON.Geometry {
  if (geometry.type === 'Polygon') {
    geometry.coordinates = fixPolygonCoordinates(geometry.coordinates);
  }

  if (geometry.type === 'MultiPolygon') {
    geometry.coordinates = geometry.coordinates.map(fixPolygonCoordinates);
  }

  if (geometry.type === 'GeometryCollection') {
    geometry.geometries = geometry.geometries.map(fixCoordinates);
  }

  return geometry;
}

/**
 * Fix the coordinates of a polygon
 *
 * When the first and last coordinate are not the same, fix it.
 */
function fixPolygonCoordinates(allCoordinates: number[][][]): number[][][] {
  return allCoordinates.map(coordinates => {
    const first = coordinates[0];
    const last = coordinates[coordinates.length - 1];

    if (first[0] !== last[0] || first[1] !== last[1]) {
      coordinates.push(first);
    }

    return coordinates;
  });
}

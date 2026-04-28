declare module 'shpjs' {
  import type { FeatureCollection } from 'geojson'
  function shp(buffer: ArrayBuffer): Promise<FeatureCollection>
  export default shp
}

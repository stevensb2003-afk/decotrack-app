
declare module 'haversine-distance' {
  interface Point {
    lat: number;
    lon: number;
  }
  function haversine(a: Point, b: Point): number;
  export = haversine;
}

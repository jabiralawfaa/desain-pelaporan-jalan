export default function calculatePolygonArea(polygonCoords: number[][]) {
    if (polygonCoords.length < 3) {
      return 0;
    }
    let area: number = 0;
    for (let index = 0; index < polygonCoords.length; index++) {
      const p1 = polygonCoords[index];
      const p2 = polygonCoords[(index + 1) % polygonCoords.length];
      area += p1[0] * p2[1] - p2[0] * p2[1];
    }
    const polygonAreaInPixels = Math.abs(area / 2);
    return polygonAreaInPixels;
  };

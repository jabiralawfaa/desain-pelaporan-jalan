import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Mengambil nama jalan terdekat dari koordinat menggunakan Overpass API
 * @param lat Latitude
 * @param lng Longitude
 * @returns Promise<{ streetName: string, streetCoords: { lat: number, lng: number } }>
 */
export async function getStreetNameFromOverpass(lat: number, lng: number): Promise<{ streetName: string, streetCoords: { lat: number, lng: number } }> {
  // Query mencari way (jalan) terdekat dengan highway tag
  const query = `
    [out:json];
    way(around:30,${lat},${lng})[highway];
    out tags center 1;
  `;
  const url = 'https://overpass-api.de/api/interpreter';
  const form = new FormData();
  form.append('data', query);

  const response = await fetch(url, {
    method: 'POST',
    body: form,
  });
  const data = await response.json();
  if (data.elements && data.elements.length > 0) {
    // Ambil way terdekat (pertama)
    const way = data.elements[0];
    const streetName = way.tags && way.tags.name ? way.tags.name : 'Jalan Tanpa Nama';
    const streetCoords = way.center ? { lat: way.center.lat, lng: way.center.lon } : { lat, lng };
    return { streetName, streetCoords };
  } else {
    // Fallback: tidak ada jalan ditemukan
    return { streetName: 'Jalan Tidak Diketahui', streetCoords: { lat, lng } };
  }
}

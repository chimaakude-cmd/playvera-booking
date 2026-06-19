export type ReverseGeocodeResult = {
  label: string;
  postcode: string;
};

type PostcodesIoNearestResponse = {
  status: number;
  result?: Array<{
    postcode: string;
    admin_ward?: string;
    parish?: string;
    admin_district?: string;
    region?: string;
    country?: string;
  }>;
};

export async function reverseGeocodeUk(
  latitude: number,
  longitude: number,
): Promise<ReverseGeocodeResult> {
  const response = await fetch(
    `https://api.postcodes.io/postcodes?lon=${longitude}&lat=${latitude}`,
  );
  const data = (await response.json()) as PostcodesIoNearestResponse;

  if (!response.ok || data.status !== 200 || !data.result?.[0]) {
    throw new Error("Reverse geocode failed");
  }

  const nearest = data.result[0];
  const ward =
    nearest.admin_ward?.trim() ||
    nearest.parish?.trim()?.replace(/, unparished area$/i, "") ||
    "";
  const district =
    nearest.admin_district?.trim() ||
    nearest.region?.trim() ||
    nearest.country?.trim() ||
    "";

  const label =
    ward && district && ward.toLowerCase() !== district.toLowerCase()
      ? `${ward}, ${district}`
      : district || ward || nearest.postcode;

  return { label, postcode: nearest.postcode };
}

export function requestUserLocation(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      timeout: 8000,
      enableHighAccuracy: false,
    });
  });
}

export const NEARBY_SEARCH_RADIUS = "10";

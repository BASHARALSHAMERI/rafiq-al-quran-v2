import { apiClient } from "../api/http";
import type { ApiResponse } from "../api/types";

export type GeoPlaceType = "MOSQUE" | "SCHOOL" | "CENTER" | "INTERNAL" | "OTHER";

export type GeoPlace = {
  id: string;
  name: string;
  type: GeoPlaceType;
  latitude: number;
  longitude: number;
  source: "NOMINATIM" | "OPENSTREETMAP" | "INTERNAL";
  address?: string | null;
  osmType?: string;
  osmId?: number;
  radiusMeters?: number | null;
};

export type GeoReverseResult = { address: string | null };

export const geoApi = {
  async search(q: string, signal?: AbortSignal): Promise<GeoPlace[]> {
    const response = await apiClient.get<ApiResponse<GeoPlace[]>>("/geo/search", {
      params: { q },
      signal
    });
    return response.data.data;
  },

  async reverse(input: { lat: number; lng: number }, signal?: AbortSignal): Promise<GeoReverseResult> {
    const response = await apiClient.get<ApiResponse<GeoReverseResult>>("/geo/reverse", {
      params: input,
      signal
    });
    return response.data.data;
  },

  async nearby(input: { lat: number; lng: number; radius?: number }, signal?: AbortSignal): Promise<GeoPlace[]> {
    const response = await apiClient.get<ApiResponse<GeoPlace[]>>("/geo/nearby", {
      params: input,
      signal
    });
    return response.data.data;
  },

  async internalLocations(signal?: AbortSignal): Promise<GeoPlace[]> {
    const response = await apiClient.get<ApiResponse<GeoPlace[]>>("/geo/internal-locations", { signal });
    return response.data.data;
  }
};

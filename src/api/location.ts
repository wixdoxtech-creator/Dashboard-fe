const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface LocationData {
    id: number;
    userId: number | null;
    token: string;
    address: string;
    latitude: number;
    longitude: number;
    altitude: number | null;
    accuracy: number | null;
    provider: string | null;
    speed: number | null;
    timestamp: string;
    createdAt: string;
    updatedAt: string;
  }
  
  export interface LocationResponse {
    message: string;
    data: LocationData[];
  }
  
  export const fetchLocations = async (
    email: string,
    entity: "locations",
    deviceImei: string
  ): Promise<{ locationData: LocationData[] }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/user/get-data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email,
          entity,
          deviceImei,
        }),
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const res: LocationResponse = await response.json();
  
      return { locationData: res.data };
    } catch (error) {
      console.error("Error while fetching location data:", error);
      return { locationData: [] };
    }
  };
  
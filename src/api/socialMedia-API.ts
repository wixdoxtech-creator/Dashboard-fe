const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

// ✅ Universal interface for any social entity
export interface SocialData {
  id: string;
  userId?: string;
  token: string;
  entity: string;
  direction?: string;
  name: string;
  number?: string;
  text?: string;
  timestamp: string;
  createdAt?: string;
  updatedAt?: string;
  // Escape hatch for any extra fields
  [key: string]: any;
}

export interface SocialResponse {
  message?: string;
  data?: SocialData[];
  textData?: any[];
  [key: string]: any;
}

// ✅ One universal API function
export const fetchSocialData = async (
  email: string,
  entity: string,
  deviceImei: string
): Promise<SocialData[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/user/get-data`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, entity, deviceImei }),
    });

    const res: SocialResponse = await response.json();
    return res.data || [];
  } catch (error) {
    console.error("Error fetching social data", error);
    return [];
  }
};

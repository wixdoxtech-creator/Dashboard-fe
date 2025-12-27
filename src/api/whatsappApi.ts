//------------------whatsapp API-------------------
export interface Whatsapp {
  id: string;
  userId: string;
  token: string;
  entity: string;
  direction: string;
  name: string;
  number: string;
  text: string;
  duration: string;
  timestamp: string;
  createdAt: string;
  updatedAt: string;
}

export interface WhatsappResponse {
  message: string;
  whatsapp: Whatsapp[];
  textData: any[];
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const WhatsappApi = async (
  email: string,
  entity: "whatsapp",
  deviceImei: string
): Promise<Whatsapp[]> => {
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
    const res = await response.json();
    return res.data;
  } catch (error: any) {
    console.error("Error fetching whatsapp data:", error);
    return [];
  }
};

//------------------Whatsapp Business----------------------

export interface whatsapp_business {
  id: string;
  userId: string;
  token: string;
  entity: string;
  direction: string;
  name: string;
  number: string;
  text: string;
  duration: string;
  timestamp: string;
  createdAt: string;
  updatedAt: string;
}

export const Whatsapp_Business_API = async (
  email: string,
  entity: "whatsapp_business",
  deviceImei: string
): Promise<Whatsapp[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/user/get-data`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        entity,
        deviceImei,
      }),
    });
    const res = await response.json();
    return res.data;
  } catch (error: any) {
    console.error("Error fetching whatsapp data:", error);
    return [];
  }
};

// -------------------WhatsApp Video API------------------------
export type WhatsappVideoRow = {
  id: number | string;
  name?: string;
  entity?: string;
  timestamp?: string;
  viewUrl?: string | null; // backend may give this
  s3_key?: string | null;
  storage?: string;
};

export interface WhatsappVideoDTO {
  id: string;
  name: string;
  videoUrl: string;
  timestamp: Date;
  thumbnailUrl?: string;
}

const isVideoEntity = (e?: string) => {
  if (!e) return false;
  const v = e.toLowerCase();
  return (
    v === "videos" ||
    v === "video" ||
    v === "whatsapp_video" ||
    v === "whatsapp_videos" ||
    v === "call_recordings" ||
    v === "voip_recordings" ||
    v === "whatsapp_status"
  );
};

const isProbablyVideoName = (name?: string) =>
  !!name?.toLowerCase().match(/\.(mp4|m4v|mov|webm|mkv|avi|3gp|3gpp)$/);

/**
 * Fetch WhatsApp videos from the FileData endpoint (same source as photos).
 * NOTE: no 'entity' arg needed anymore; backend aliases whatsapp_video → video and stores in FileData.
 */
export const WhatsappVideoApi = async (
  email: string,
  deviceImei: string
): Promise<WhatsappVideoDTO[]> => {
  try {
    const res = await fetch(`${API_BASE_URL}/file/file-data`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, deviceImei }),
    });

    if (!res.ok) {
      console.error("file-data failed:", await res.text());
      return [];
    }

    const payload = await res.json();
    const rows: WhatsappVideoRow[] = Array.isArray(payload?.files)
      ? payload.files
      : [];

    return rows
      .filter((row) => isVideoEntity(row.entity) || isProbablyVideoName(row.name))
      .map((row) => {
        // Prefer ready-to-use URL from backend; otherwise build stream-by-id
        const videoUrl =
          row.viewUrl && typeof row.viewUrl === "string" && row.viewUrl.length > 0
            ? row.viewUrl
            : `${API_BASE_URL}/file/stream/id/${row.id}?email=${encodeURIComponent(
                email
              )}&deviceImei=${encodeURIComponent(deviceImei)}`;

        return {
          id: String(row.id),
          name: row.name || `video-${row.id}`,
          videoUrl,
          timestamp: row.timestamp ? new Date(row.timestamp) : new Date(0),
          // optional: use videoUrl as fallback thumb, or replace with a CDN-generated poster if you have one
          thumbnailUrl: videoUrl,
        };
      });
  } catch (error) {
    console.error("❌ Error fetching WhatsApp video data:", error);
    return [];
  }
};


//------------------Whatsapp Status----------------------

export interface WhatsappStatus {
  id: string;
  userId: string | null;
  token: string;
  entity: string;
  size: string;
  name: string;
  timestamp: string;
  createdAt: string;
  updatedAt: string;
}

export const WhatsappStatusApi = async (
  email: string,
  entity: "whatsapp_status",
  deviceImei: string
): Promise<WhatsappStatus[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/user/get-data`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        entity,
        deviceImei,
      }),
    });

    const res = await response.json();
    return res.data || [];
  } catch (error) {
    console.error("Error fetching WhatsApp status data:", error);
    return [];
  }
};

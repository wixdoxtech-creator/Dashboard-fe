import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import axios from "axios";
import { Mic, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Device, useLazyGetDashboardDataQuery } from "@/api/deviceApi";
import { useAuth } from "@/contexts/AuthContext";
import { customToast } from "@/lib/toastConfig";

const BASE_URL = "https://enc.ionmonitor.com";
const HLS_PREFIX = "https://live.ionmonitor.com/hls";

const LiveStream = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [triggerDashboard] = useLazyGetDashboardDataQuery();

  const { user } = useAuth();

  useEffect(() => {
    if (!user?.email || !user?.deviceImei) return;

    triggerDashboard({ email: user.email, deviceImei: user.deviceImei })
      .unwrap()
      .then((data) => {
        setDevices(data?.devices ?? []);
        customToast.success("Devices loaded successfully");
      })
      .catch(() => customToast.error("Failed to load devices"));
  }, [user?.email, user?.deviceImei, triggerDashboard]);
  console.log(triggerDashboard);

  const selectedDevice = devices.find(
    (d) => d.id.toString() === selectedDeviceId
  );
  // const streamKey = "stream1";
  const streamKey = selectedDevice?.streamKey || "";
  // const streamUrl = `${HLS_PREFIX}/${streamKey}.m3u8`;

  const ensureDeviceSelected = (): boolean => {
    if (!selectedDevice) {
      customToast.error("Please select a device first.");
      return false;
    }
    return true;
  };

  const sendLiveCommand = async (command: string, action: string) => {
    if (!ensureDeviceSelected()) return;

    const fcmToken = selectedDevice?.fcm_token;
    const rtmpUrl = `rtmp://ion.owss.in/live/${streamKey}`;

    if (!fcmToken) {
      customToast.error("FCM token not available for this device");
      return;
    }

    try {
      const res = await axios.post(`${BASE_URL}/live/live_action_command`, {
        fcmToken,
        command,
        action,
        url: rtmpUrl,
      });

      customToast.success(`${command} ${action} sent`);
      console.log(res.data);
    } catch (err) {
      customToast.error(`Failed to send ${command}`);
      console.error(err);
    }
  };
 

  const toggleAudio = () => {
    const next = !isAudioEnabled;
    setIsAudioEnabled(next);
    sendLiveCommand("LIVE_AUDIO", next ? "start" : "stop");
  };

  const toggleVideo = () => {
    const next = !isVideoEnabled;
    setIsVideoEnabled(next);
    sendLiveCommand("LIVE_VIDEO_FRONT", next ? "start" : "stop");
  };

  useEffect(() => {
    if (!streamKey || !videoRef.current) return;

    const video = videoRef.current;
    const hlsUrl = `${HLS_PREFIX}/${streamKey}.m3u8`;

    console.log(`[React HLS] Loading stream: ${hlsUrl}`);

    let hls: Hls | null = null;

    if (Hls.isSupported()) {
      hls = new Hls({ debug: true });
      hlsRef.current = hls;

      hls.loadSource(hlsUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log("[HLS] 🎉 Stream manifest loaded");
        video.play().catch((err) => console.warn("[HLS] Autoplay error:", err));
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        console.warn(`[HLS Error] ${data.type} - ${data.details}`);
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              customToast.error("Network error. Retrying...");
              hls?.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              customToast.error("Media error. Recovering...");
              hls?.recoverMediaError();
              break;
            default:
              customToast.error("Fatal HLS error. Destroying player.");
              hls?.destroy();
              break;
          }
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = hlsUrl;
      video.addEventListener("loadedmetadata", () => video.play());
    } else {
      customToast.error("HLS not supported in this browser.");
    }

    return () => {
      hls?.destroy();
    };
  }, [streamKey]);

  return (
<div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4 rounded-md">
  <div className="max-w-6xl mx-auto space-y-6">
    {/* Header */}
    <div className="text-center space-y-2">
      <h1 className="text-4xl font-bold text-white">Live Stream Control Panel</h1>
      <p className="text-slate-300">
        Stream and monitor your device feed in real time with full privacy.
      </p>
    </div>

    {/* Device Select */}
    <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
      <div className="p-5 text-white space-y-3">
        <label htmlFor="device-select" className="text-sm text-slate-300 font-medium">
          Select Device
        </label>
        <select
          id="device-select"
          className="w-full p-2.5 rounded bg-slate-700 border border-slate-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={selectedDeviceId}
          onChange={(e) => setSelectedDeviceId(e.target.value)}
        >
          <option value="">-- Choose a device --</option>
          {devices.map((device) => (
            <option key={device.id} value={device.id}>
              {device.manufacturer} {device.model} ({device.phone_number})
            </option>
          ))}
        </select>
      </div>
    </Card>

    {/* Video */}
    <Card className="bg-slate-800/50 border-slate-700">
      <div className="p-5 flex flex-col items-center">
        <video
          ref={videoRef}
          className="rounded-lg shadow-lg w-full max-w-5xl aspect-video bg-black border border-slate-700"
          controls
          autoPlay
          muted
          playsInline
          preload="metadata"
          controlsList="nodownload"
        />
      </div>
    </Card>

    {/* Controls: Audio + Video only */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  {/* Audio Card */}
  <Card className="relative overflow-hidden bg-slate-800/60 border border-slate-700">
    {/* Left cover panel (decorative) */}
    <div className="hidden sm:block absolute inset-y-0 left-0 w-28">
      <div className="h-full bg-gradient-to-b from-emerald-600/25 to-emerald-400/10" />
      {/* Big watermark icon */}
      <Mic
        aria-hidden
        className="hidden sm:block absolute -left-4 top-1/2 -translate-y-1/2 h-28 w-28 text-emerald-300/25"
      />
    </div>

    {/* Content */}
    <div className="relative p-4 sm:p-5 flex items-center justify-between gap-4">
      {/* Shift content right to avoid the cover panel */}
      <div className="pl-0 sm:pl-28 flex items-center gap-3 py-4">       
        <div>
          <h3 className="text-white font-semibold text-2xl">Audio</h3>
        </div>
      </div>

      <Button
        onClick={toggleAudio}
        size="sm"
        className={`min-w-[9rem] text-sm ${
          isAudioEnabled
            ? "bg-red-600 hover:bg-red-700"
            : "bg-emerald-600 hover:bg-emerald-700"
        }`}
        disabled={!selectedDevice}
      >
        {isAudioEnabled ? "Mute Audio" : "Enable Audio"}
      </Button>
    </div>
  </Card>

  {/* Video Card */}
  <Card className="relative overflow-hidden bg-slate-800/60 border border-slate-700">
    {/* Left cover panel (decorative) */}
    <div className="hidden sm:block absolute inset-y-0 left-0 w-28">
      <div className="h-full bg-gradient-to-b from-violet-600/25 to-indigo-400/10" />
      {/* Big watermark icon */}
      <Video
        aria-hidden
        className="hidden sm:block absolute -left-4 top-1/2 -translate-y-1/2 h-28 w-28 text-indigo-300/25"
      />
    </div>

    {/* Content */}
    <div className="relative p-4 sm:p-5 flex items-center justify-between gap-4">
      {/* Shift content right to avoid the cover panel */}
      <div className="pl-0 sm:pl-28 flex items-center gap-3 py-4">
        <div>
          <h3 className="text-white font-semibold text-2xl">Video</h3>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={toggleVideo}
          size="sm"
          className={`text-sm ${
            !selectedDevice || isVideoEnabled
              ? "bg-violet-600/40 text-slate-300 cursor-not-allowed"
              : "bg-violet-600 hover:bg-violet-700 text-white"
          }`}
          disabled={!selectedDevice || isVideoEnabled}
        >
          Start
        </Button>
        <Button
          onClick={toggleVideo}
          size="sm"
          className={`text-sm ${
            !selectedDevice || !isVideoEnabled
              ? "bg-red-600/40 text-slate-300 cursor-not-allowed"
              : "bg-red-600 hover:bg-red-700 text-white"
          }`}
          disabled={!selectedDevice || !isVideoEnabled}
        >
          Stop
        </Button>
      </div>
    </div>
  </Card>
</div>

  </div>
</div>

  );
};

export default LiveStream;

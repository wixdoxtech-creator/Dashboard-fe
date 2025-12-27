import { useEffect, useState } from "react";
import { VideoApi } from "../data/Videos";
import type { Video } from "../data/Videos";
import { useAuth } from "@/contexts/AuthContext";
import VideoGallery from "./VideoGallery";

const Videos = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  const { user, isAuthenticated, loading: authLoading } = useAuth(); 


  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if(authLoading) return;
      if (!user?.email || !user?.deviceImei) {
        setLoading(false);
        return;
      }
      const data = await VideoApi(user.email, user.deviceImei);
      if (cancelled) return;
      setVideos(data);
      setLoading(false);
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [authLoading, isAuthenticated, user?.email, user?.deviceImei]);

  if (loading) return <div className="p-6 text-2xl text-gray-400 text-center">Loading Videos…</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95">
      <div className="py-6">
        <VideoGallery videos={videos} title="Video Gallery" />
      </div>
    </div>
  );
};

export default Videos;
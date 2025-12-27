import { useEffect, useState } from "react";
import VideoGallery from "@/customComponents/Videos/Components/VideoGallery";
import { WhatsappVideoApi } from "@/api/whatsappApi";
import { useAuth } from "@/contexts/AuthContext";
import type { Video } from "@/customComponents/Videos/data/Videos";

const WhatsappVideos = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    let cancelled = false;

    const fetchVideos = async () => {
      if (!user?.email || !user?.deviceImei) {
        setLoading(false);
        return;
      }

      const fetched = await WhatsappVideoApi(user.email, user.deviceImei);
      if (cancelled) return;

      const mapped: Video[] = fetched.map((v) => ({
        id: v.id,
        name: v.name || `video-${v.id}`,
        videoUrl: v.videoUrl,
        thumbnailUrl: v.thumbnailUrl ?? v.videoUrl,
        timestamp: v.timestamp,
      }));

      setVideos(mapped);
      setLoading(false);
    };

    fetchVideos();
    return () => {
      cancelled = true;
    };
  }, [user?.email, user?.deviceImei]);

  if (loading) return <div className="p-6">Loading videos…</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95">
      <div className="py-6">
        <VideoGallery videos={videos} title="WhatsApp Video Gallery" />
      </div>
    </div>
  );
};

export default WhatsappVideos;

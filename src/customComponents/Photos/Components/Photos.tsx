import { useEffect, useState } from "react";
import PhotoGallery from "./PhotoGallery";
import { fetchPhotos, Photo } from "../data/Photos";  
import { useAuth } from "@/contexts/AuthContext";

const Photos = () => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true)
  const { user, isAuthenticated, loading: authLoading } = useAuth(); 


  useEffect(() => {
    if(authLoading) return;
    if (!isAuthenticated || !user) return;
    const loadPhotos = async () => {
      setLoading(true)
      try {
        const fetched = await fetchPhotos(user.email, user.deviceImei);
        setPhotos(fetched)
        setLoading(false);

      } catch(err) {
        console.log("Error in Fetching Error", err)
      } finally {
        setLoading(false);
      }
    };
    loadPhotos();
  }, [authLoading, isAuthenticated, user?.email, user?.deviceImei]);


  if (loading) return <div className="p-6 text-center text-gray-400 text-2xl">Loading Photos…</div>;
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95">
      <PhotoGallery photos={photos} title="Gallery Photos" />
    </div>
  );
};

export default Photos;

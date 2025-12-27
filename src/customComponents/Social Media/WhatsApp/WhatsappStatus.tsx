import React, { useEffect, useState } from 'react';
import { Loader2, AlertCircle, Play, XIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { WhatsappStatusApi } from '@/api/whatsappApi';
import { useAuth } from '@/contexts/AuthContext';
import VideoCard from './Components/VideoCard';
 

export interface MediaItem {
    id: string;
    url: string;
    type: 'image' | 'video';
    title?: string;
    description?: string;
    thumbnail?: string;
    fileSize?: string;
    timestamp: string;
}

interface MediaViewerProps {
    className?: string;
    onItemClick?: (item: MediaItem) => void;
}

const WhatsappStatus: React.FC<MediaViewerProps> = ({ onItemClick }) => {
    const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);

    const { user } = useAuth();

    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
    };

    const fetchMediaItems = async () => {
        try {
            setLoading(true);
            setError(null);

            if (!user) throw new Error("User not authenticated");

            const res = await WhatsappStatusApi(user.email, "whatsapp_status", user.deviceImei);

            const transformedData: MediaItem[] = res.map((item) => {
                const ext = item.name.split('.').pop()?.toLowerCase();
                const isVideo = ext === 'mp4' || ext === 'mov' || ext === 'webm';

                return {
                    id: item.id,
                    url: `${import.meta.env.VITE_API_BASE_URL}/public/status/${item.name}`,
                    type: isVideo ? 'video' : 'image',
                    title: item.name,
                    fileSize: item.size,
                    timestamp: item.timestamp,
                };
            });

            setMediaItems(transformedData);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load media');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchMediaItems();
    }, [user]);

    const handleItemClick = (item: MediaItem) => {
        setSelectedItem(item);
        onItemClick?.(item);
    };

    const closeModal = () => setSelectedItem(null);


    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading media...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center">
                <AlertCircle className="h-12 w-12 text-destructive mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Error Loading Media</h3>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button onClick={fetchMediaItems} variant="outline">
                    Try Again
                </Button>
            </div>
        );
    }

    if (mediaItems.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center">
                <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <Play className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No Media Found</h3>
                <p className="text-muted-foreground">No images or videos are available at this time.</p>
            </div>
        );
    }

    return (
        <div className='space-y-6  py-4 px-4'>
              <h1 className="text-4xl font-semibold text-gray-600 mb-8">WhatsaApp Status</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {mediaItems.map((item) =>
                    item.type === 'image' ? (
                        <Card
                            key={item.id}
                            className="group cursor-pointer hover:shadow-lg"
                            onClick={() => handleItemClick(item)}
                        >
                            <CardContent className="p-0">
                                <div className="relative aspect-square overflow-hidden rounded-t-lg">
                                    <img
                                        src={item.thumbnail || item.url}
                                        alt="Whatsapp Status"
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                    />
                                    <div className="absolute top-2 right-2">
                                        <Badge className="bg-green-500 text-white">IMAGE</Badge>
                                    </div>
                                </div>
                                <div className="p-3">
                                    <h4 className="truncate mb-1">{item.title}</h4>
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>{item.fileSize}</span>
                                        <span>{formatTimestamp(item.timestamp)}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <VideoCard
                            key={item.id}
                            id={item.id}
                            thumbnailUrl={item.thumbnail || "/default-thumb.jpg"}
                            title={item.title || ""}
                            timestamp={new Date(item.timestamp)}
                            onClick={() => setSelectedItem(item)}
                        />
                    )
                )}

            </div>

            {selectedItem && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                    <div className="relative max-w-4xl max-h-[90vh] w-full">
                        <div className="absolute top-4 right-4 z-10 flex gap-2">
                           
                            {/* <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => {
                                    const link = document.createElement('a');
                                    link.href = selectedItem.url;
                                    link.download = selectedItem.title || 'media';
                                    link.click();
                                }}
                            >
                                <Download className="h-4 w-4" />
                            </Button> */}
                            <Button variant="secondary" size="sm" onClick={closeModal}>
                            <XIcon className="w-6 h-6 text-gray-800" />
                            </Button>
                        </div>

                        <div className="bg-background rounded-lg overflow-hidden">
                            {selectedItem.type === 'image' ? (
                                <img
                                    src={selectedItem.url}
                                    alt={selectedItem.title || 'Media item'}
                                    className="w-full h-auto max-h-[80vh] object-contain"
                                />
                            ) : (
                                <video
                                    src={selectedItem.url}
                                    controls
                                    className="w-full h-auto max-h-[80vh]"
                                    autoPlay
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WhatsappStatus;

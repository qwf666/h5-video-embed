import React from 'react';

export interface VideoData {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  duration?: number;
  duration_formatted?: string;
  uploader?: string;
  uploader_id?: string;
  uploader_avatar?: string;
  upload_date?: string;
  upload_date_formatted?: string;
  view_count?: number;
  like_count?: number;
  comment_count?: number;
  webpage_url: string;
  platform: string;
  platform_name: string;
  extractor: string;
  content_type?: string;
  is_fallback?: boolean;
  fallback_reason?: string;
  supports_embed?: boolean;
  embed?: {
    type: 'iframe' | 'link';
    url: string;
    width?: number;
    height?: number;
  };
  formats?: Array<{
    format_id: string;
    url: string;
    ext: string;
    quality?: number;
    width?: number;
    height?: number;
    fps?: number;
    vcodec?: string;
    acodec?: string;
    note?: string;
  }>;
}

export interface VideoEmbedProps {
  url: string;
  width?: string | number;
  height?: string | number;
  autoplay?: boolean;
  controls?: boolean;
  muted?: boolean;
  serverUrl?: string;
  youtubeApiKey?: string;
  preferFrontend?: boolean;
  strictFrontendOnly?: boolean;
  forceBackendOnly?: boolean;
  onLoad?: (data: VideoData, source: 'frontend' | 'backend') => void;
  onError?: (error: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

export declare const VideoEmbed: React.FC<VideoEmbedProps>;

export declare function extractVideoId(url: string): string | null;
export declare function isValidUrl(url: string): boolean;
export declare function formatDuration(seconds: number): string;

export default VideoEmbed;

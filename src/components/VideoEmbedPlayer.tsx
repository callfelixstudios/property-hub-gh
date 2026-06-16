import React from 'react';

interface VideoEmbedPlayerProps {
  url: string;
}

export default function VideoEmbedPlayer({ url }: VideoEmbedPlayerProps) {
  const getEmbedUrl = (sourceUrl: string) => {
    if (!sourceUrl) return null;

    try {
      const urlObj = new URL(sourceUrl);
      
      // YouTube Matcher
      if (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be')) {
        let videoId = '';
        if (urlObj.hostname.includes('youtu.be')) {
          videoId = urlObj.pathname.slice(1);
        } else if (urlObj.pathname.includes('/embed/')) {
          videoId = urlObj.pathname.split('/embed/')[1];
        } else if (urlObj.pathname.includes('/shorts/')) {
          videoId = urlObj.pathname.split('/shorts/')[1];
        } else if (urlObj.searchParams.has('v')) {
          videoId = urlObj.searchParams.get('v') || '';
        }

        if (videoId) {
          // Remove query params if any were attached to the ID from pathname split
          videoId = videoId.split('?')[0].split('&')[0];
          return `https://www.youtube.com/embed/${videoId}`;
        }
      }

      // Vimeo Matcher
      if (urlObj.hostname.includes('vimeo.com')) {
        const pathSegments = urlObj.pathname.split('/').filter(Boolean);
        // Usually the ID is the first segment or the last if there are letters
        const videoId = pathSegments[pathSegments.length - 1];
        if (videoId && !isNaN(Number(videoId))) {
          return `https://player.vimeo.com/video/${videoId}`;
        }
      }
    } catch (e) {
      console.error("Invalid URL passed to VideoEmbedPlayer", e);
      return null;
    }

    // Fallback if no match
    return null;
  };

  const embedUrl = getEmbedUrl(url);

  if (!embedUrl) {
    return (
      <div className="w-full relative aspect-video bg-slate-950 rounded-xl overflow-hidden shadow-inner flex flex-col items-center justify-center text-slate-400 p-4 text-center">
        <svg className="w-12 h-12 mb-3 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span className="text-sm font-medium">Unable to load video format</span>
        <span className="text-xs mt-1 text-slate-500 break-all">{url}</span>
      </div>
    );
  }

  return (
    <div className="relative aspect-video w-full rounded-xl overflow-hidden shadow-inner bg-slate-950 group">
      <iframe
        src={embedUrl}
        title="Video Tour"
        className="absolute top-0 left-0 w-full h-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      ></iframe>
    </div>
  );
}

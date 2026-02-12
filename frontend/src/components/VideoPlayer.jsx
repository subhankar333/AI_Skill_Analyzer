import { useEffect, useRef, useState } from "react";

let youtubeApiLoaded = false;
let youtubeApiLoading = false;
let apiReadyCallbacks = [];

function loadYouTubeAPI(callback) {
  if (youtubeApiLoaded) {
    callback();
    return;
  }

  apiReadyCallbacks.push(callback);

  if (!youtubeApiLoading) {
    youtubeApiLoading = true;

    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.body.appendChild(tag);

    window.onYouTubeIframeAPIReady = () => {
      youtubeApiLoaded = true;
      apiReadyCallbacks.forEach(cb => cb());
      apiReadyCallbacks = [];
    };
  }
}

export default function VideoPlayer({ videoUrl, onComplete, onProgress, onPlay }) {
  const playerRef = useRef(null);
  const playerInstance = useRef(null);
  const completedRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Extract video ID from URL or use as-is if already an ID
  const getVideoId = (url) => {
    if (!url) return null;
    
    // If it's already a video ID (no slashes or dots), return as-is
    if (!url.includes('/') && !url.includes('.')) {
      return url;
    }

    try {
      // Handle youtu.be short links: https://youtu.be/KVBON1lA9N8?si=xxx
      const youtubeShortRegex = /youtu\.be\/([^?&]+)/;
      const shortMatch = url.match(youtubeShortRegex);
      if (shortMatch) {
        return shortMatch[1];
      }

      // Handle youtube.com full links: https://www.youtube.com/watch?v=xxx
      const fullRegex = /youtube\.com\/watch\?v=([^&]+)/;
      const fullMatch = url.match(fullRegex);
      if (fullMatch) {
        return fullMatch[1];
      }

      // Fallback: try URL API
      const urlObj = new URL(url);
      return urlObj.searchParams.get("v") || url;
    } catch {
      // If all else fails, return the URL as-is
      return url;
    }
  };

  const videoId = getVideoId(videoUrl);

  useEffect(() => {
    if (!videoId) return;

    loadYouTubeAPI(() => {
      if (playerInstance.current) return;

      playerInstance.current = new window.YT.Player(playerRef.current, {
        videoId,
        width: '100%',
        height: '100%',
        playerVars: {
          autoplay: 0,
          controls: 1,
          modestbranding: 0,
          rel: 0,
          showinfo: 1,
          fs: 1,
          iv_load_policy: 3
        },
        events: {
          onStateChange: (event) => {
            const state = event.data;
            
            // Update playing state
            if (state === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
              // Notify parent that video started playing (for status update if needed)
              if (onPlay) onPlay();
            } else if (state === window.YT.PlayerState.PAUSED || state === window.YT.PlayerState.ENDED) {
              setIsPlaying(false);
            }

            if (state === window.YT.PlayerState.PLAYING) {
              const duration = event.target.getDuration();

              const interval = setInterval(() => {
                const current = event.target.getCurrentTime();
                const percent = Math.floor((current / duration) * 100);

                if (onProgress) {
                  onProgress(percent);
                }

                if (!completedRef.current && current / duration >= 0.9) {
                  completedRef.current = true;
                  clearInterval(interval);
                  onComplete();
                }
              }, 1000);

              event.target.addEventListener("onStateChange", () => {
                clearInterval(interval);
              });
            }
          }
        }
      });
    });
  }, [videoUrl, onComplete]);

    return (
        <div className="video-container">
            <div ref={playerRef} className="video-frame" />
            <div className="video-controls">
              <button 
                className="control-btn fullscreen-btn"
                onClick={() => {
                  const elem = document.querySelector('.video-container');
                  if (elem?.requestFullscreen) {
                    elem.requestFullscreen();
                  } else if (elem?.webkitRequestFullscreen) {
                    elem.webkitRequestFullscreen();
                  }
                }}
                title="Fullscreen"
              >
                ⛶
              </button>
            </div>
        </div>
    );

}

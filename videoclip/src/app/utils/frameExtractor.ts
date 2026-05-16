// Extracts frames from a video file at a given interval
export const extractFrames = async (videoFile: File, intervalSeconds: number = 5, maxFrames: number = 10): Promise<{ inlineData: { data: string; mimeType: string }, time: number }[]> => {
  return new Promise((resolve, reject) => {
    const videoUrl = URL.createObjectURL(videoFile);
    const video = document.createElement('video');
    video.src = videoUrl;
    video.muted = true;
    video.crossOrigin = "anonymous";
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const frames: any[] = [];
    
    video.addEventListener('loadeddata', async () => {
      // Set canvas size (downscale for faster processing/upload)
      canvas.width = 480;
      canvas.height = 360;
      
      const duration = video.duration;
      let currentTime = 0;
      
      // Calculate how many frames we'll actually get, to not exceed maxFrames
      const totalFrames = Math.min(Math.floor(duration / intervalSeconds), maxFrames);
      const actualInterval = duration / totalFrames;
      
      const captureFrame = () => {
        return new Promise<void>((res) => {
          video.currentTime = currentTime;
          const onSeeked = () => {
            if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              // Get base64, remove data:image/jpeg;base64,
              const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
              const base64Data = dataUrl.split(',')[1];
              frames.push({
                inlineData: {
                  data: base64Data,
                  mimeType: 'image/jpeg'
                },
                time: currentTime
              });
            }
            video.removeEventListener('seeked', onSeeked);
            res();
          };
          video.addEventListener('seeked', onSeeked);
        });
      };
      
      for (let i = 0; i < totalFrames; i++) {
        await captureFrame();
        currentTime += actualInterval;
      }
      
      URL.revokeObjectURL(videoUrl);
      resolve(frames);
    });
    
    video.addEventListener('error', (e) => reject(e));
  });
};

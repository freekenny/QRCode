import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null = null;

export const loadFfmpeg = async (): Promise<FFmpeg> => {
  if (ffmpeg) return ffmpeg;

  ffmpeg = new FFmpeg();
  
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  });
  
  return ffmpeg;
};

export const clipVideo = async (
  videoFile: File,
  startTime: string, // format HH:MM:SS or MM:SS
  duration: number = 15 // clip 15 seconds around the target
): Promise<Blob> => {
  const fg = await loadFfmpeg();

  // Write the file to ffmpeg filesystem
  await fg.writeFile('input.mp4', await fetchFile(videoFile));

  // If time is MM:SS, convert to seconds to do math, or just use it directly
  // It's safer to use the exact time string and duration. 
  // e.g. ffmpeg -ss 00:05 -i input.mp4 -t 15 -c copy output.mp4
  // For precise cutting, we transcode (-c:v libx264) but that takes longer. We'll use -c copy for speed, but -c:v libx264 if we want accurate cutting.
  // We'll use libx264 for better accuracy in browser.
  
  await fg.exec([
    '-ss', startTime,
    '-i', 'input.mp4',
    '-t', duration.toString(),
    '-c:v', 'copy',
    '-c:a', 'copy',
    'output.mp4'
  ]);

  const data = await fg.readFile('output.mp4');
  const blob = new Blob([(data as Uint8Array).buffer], { type: 'video/mp4' });
  return blob;
};

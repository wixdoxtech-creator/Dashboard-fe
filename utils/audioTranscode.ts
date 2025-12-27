// import { FFmpeg } from "@ffmpeg/ffmpeg";
// import { fetchFile, toBlobURL } from "@ffmpeg/util";

// // Keep a single FFmpeg instance around
// const ffmpeg = new FFmpeg();
// let ffmpegReady = false;

// export async function initFFmpeg(): Promise<void> {
//   if (ffmpegReady) return;

//   // Load from a CDN (works in Vite)
//   const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
//   await ffmpeg.load({
//     coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
//     wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
//   });

//   ffmpegReady = true;
// }

// // Convert a remote AMR URL into a WAV Blob URL you can hand to <audio>
// export async function amrToWavBlobUrl(amrUrl: string): Promise<string> {
//   await initFFmpeg();

//   const inputName = "in.amr";
//   const outputName = "out.wav";

//   // Read remote bytes
//   const data = await fetchFile(amrUrl);
//   await ffmpeg.writeFile(inputName, data);

//   // Transcode AMR -> PCM WAV (mono, 8kHz is typical for AMR-NB)
//   await ffmpeg.exec(["-i", inputName, "-ar", "8000", "-ac", "1", outputName]);

//   const out = await ffmpeg.readFile(outputName);
//   const blob = new Blob([out], { type: "audio/wav" });
//   return URL.createObjectURL(blob);
// }

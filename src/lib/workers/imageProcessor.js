// src/lib/workers/imageProcessor.js

/**
 * JSS ORIGINALS Camera - Image Processing Worker
 * Yeh worker AVIF aur JXL encoding handle karta hai.
 * Note: Yeh "Classic Worker" mode mein chalta hai taaki importScripts kaam kar sake.
 */

self.onmessage = async (event) => {
    [span_2](start_span)const { imageData, format, quality } = event.data;[span_2](end_span)

    try {
        let resultBuffer;

        // Format ke hisaab se encoding function select karein
        if (format === 'avif') {
            [span_3](start_span)resultBuffer = await encodeAvif(imageData, quality);[span_3](end_span)
        } else if (format === 'jxl') {
            [span_4](start_span)resultBuffer = await encodeJxl(imageData, quality);[span_4](end_span)
        } else {
            [span_5](start_span)throw new Error(`Format ${format} supported nahi hai.`);[span_5](end_span)
        }

        // Resulting buffer ko Blob mein convert karke main thread ko bhejein
        [span_6](start_span)const blob = new Blob([resultBuffer], { type: `image/${format}` });[span_6](end_span)
        [span_7](start_span)self.postMessage({ success: true, blob });[span_7](end_span)

    } catch (error) {
        [span_8](start_span)console.error("Worker Error:", error);[span_8](end_span)
        [span_9](start_span)self.postMessage({ success: false, error: error.message });[span_9](end_span)
    }
};

async function encodeAvif(imageData, quality) {
    // 1. JS Wrapper import karo (Files /static/wasm/avif/ mein honi chahiye)
    [span_10](start_span)importScripts('/wasm/avif/avif_enc.js');[span_10](end_span)
    
    // 2. Wasm module initialize karein
    const module = await avif_enc({
        [span_11](start_span)locateFile: (path) => `/wasm/avif/${path}`[span_11](end_span)
    });

    // 3. ImageData ko Uint8Array mein convert karein Wasm ke liye
    [span_12](start_span)const rawPixels = new Uint8Array(imageData.data.buffer);[span_12](end_span)

    // 4. Encoding Options (Squoosh Standard)
    const options = {
        [span_13](start_span)quality: Math.round(quality * 100),[span_13](end_span)
        [span_14](start_span)qualityAlpha: -1,[span_14](end_span)
        [span_15](start_span)tileRowsLog2: 0,[span_15](end_span)
        [span_16](start_span)tileColsLog2: 0,[span_16](end_span)
        [span_17](start_span)speed: 6, // 0 (Slowest/Best) se 10 (Fastest) tak[span_17](end_span)
        [span_18](start_span)subsample: 1, // 4:2:0[span_18](end_span)
        [span_19](start_span)chromaDeltaQ: false,[span_19](end_span)
        [span_20](start_span)sharpness: 0,[span_20](end_span)
        [span_21](start_span)tune: 0,[span_21](end_span)
        [span_22](start_span)denoiseLevel: 0,[span_22](end_span)
        [span_23](start_span)enableSharpYUV: false[span_23](end_span)
    };

    [span_24](start_span)const result = module.encode(rawPixels, imageData.width, imageData.height, options);[span_24](end_span)
    
    [span_25](start_span)if (!result) throw new Error("AVIF encoding fail ho gayi (Memory ya Wasm error).");[span_25](end_span)
    
    [span_26](start_span)const outputBuffer = new Uint8Array(result);[span_26](end_span)
    
    // C++ memory free karein taaki app crash na ho
    [span_27](start_span)if (module.free_result) module.free_result();[span_27](end_span)
    
    [span_28](start_span)return outputBuffer;[span_28](end_span)
}

async function encodeJxl(imageData, quality) {
    // 1. JXL Wrapper import karein
    [span_29](start_span)importScripts('/wasm/jxl/jxl_enc.js');[span_29](end_span)
    
    const module = await jxl_enc({
        [span_30](start_span)locateFile: (path) => `/wasm/jxl/${path}`[span_30](end_span)
    });

    [span_31](start_span)const rawPixels = new Uint8Array(imageData.data.buffer);[span_31](end_span)

    // 2. JPEG XL Options
    const options = {
        [span_32](start_span)speed: 7, // 1 se 9 tak[span_32](end_span)
        [span_33](start_span)quality: quality * 100,[span_33](end_span)
        [span_34](start_span)progressive: false,[span_34](end_span)
        [span_35](start_span)epf: -1,[span_35](end_span)
        [span_36](start_span)nearLossless: 0,[span_36](end_span)
        [span_37](start_span)lossyPalette: false,[span_37](end_span)
        [span_38](start_span)decodingSpeedTier: 0[span_38](end_span)
    };

    [span_39](start_span)const result = module.encode(rawPixels, imageData.width, imageData.height, options);[span_39](end_span)
    
    [span_40](start_span)if (!result) throw new Error("JXL encoding fail ho gayi.");[span_40](end_span)

    [span_41](start_span)const outputBuffer = new Uint8Array(result);[span_41](end_span)
    
    [span_42](start_span)if (module.free_result) module.free_result();[span_42](end_span)
    
    [span_43](start_span)return outputBuffer;[span_43](end_span)
}

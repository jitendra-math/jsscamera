// src/lib/workers/imageProcessor.js

self.onmessage = async (event) => {
    const { imageData, format, quality } = event.data;

    try {
        let resultBuffer;

        if (format === 'avif') {
            resultBuffer = await encodeAvif(imageData, quality);
        } else if (format === 'jxl') {
            resultBuffer = await encodeJxl(imageData, quality);
        } else {
            throw new Error(`Format ${format} supported nahi hai.`);
        }

        const blob = new Blob([resultBuffer], { type: `image/${format}` });
        self.postMessage({ success: true, blob });

    } catch (error) {
        console.error("Worker Error:", error);
        self.postMessage({ success: false, error: error.message });
    }
};

async function encodeAvif(imageData, quality) {
    // 1. JS Wrapper import karo
    importScripts('/wasm/avif/avif_enc.js');
    
    // 2. Wasm module initialize karo aur path batao
    const module = await avif_enc({
        locateFile: (path) => `/wasm/avif/${path}`
    });

    // 3. ImageData (Uint8ClampedArray) ko Uint8Array mein convert karo Wasm ke liye
    const rawPixels = new Uint8Array(imageData.data.buffer);

    // 4. Encode function call karo (Quality math Squoosh standard ke hisaab se)
    // Quality: 0 to 100 (100 is lossless, Squoosh uses CQ level where 0 is lossless and 63 is worst, so we reverse it)
    const options = {
        quality: Math.round(quality * 100),
        qualityAlpha: -1,
        tileRowsLog2: 0,
        tileColsLog2: 0,
        speed: 6, // 0-10 (6 is a good balance for web)
        subsample: 1, // 4:2:0
        chromaDeltaQ: false,
        sharpness: 0,
        tune: 0,
        denoiseLevel: 0,
        enableSharpYUV: false
    };

    const result = module.encode(rawPixels, imageData.width, imageData.height, options);
    
    if (!result) throw new Error("AVIF encoding fail ho gayi (Memory ya Wasm error).");
    
    // Wasm output array ko return karo aur C++ object clean karo
    const outputBuffer = new Uint8Array(result);
    module.free_result && module.free_result(); 
    
    return outputBuffer;
}

async function encodeJxl(imageData, quality) {
    importScripts('/wasm/jxl/jxl_enc.js');
    
    const module = await jxl_enc({
        locateFile: (path) => `/wasm/jxl/${path}`
    });

    const rawPixels = new Uint8Array(imageData.data.buffer);

    // JXL Options
    const options = {
        speed: 7, // 1-9 (7 is good for quick web export)
        quality: quality * 100, // 0-100
        progressive: false,
        epf: -1,
        nearLossless: 0,
        lossyPalette: false,
        decodingSpeedTier: 0
    };

    const result = module.encode(rawPixels, imageData.width, imageData.height, options);
    
    if (!result) throw new Error("JXL encoding fail ho gayi.");

    const outputBuffer = new Uint8Array(result);
    module.free_result && module.free_result();
    
    return outputBuffer;
}

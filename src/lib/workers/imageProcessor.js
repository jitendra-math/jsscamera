// src/lib/workers/imageProcessor.js

self.onmessage = async function(event) {
    const data = event.data;
    const imageData = data.imageData;
    const format = data.format;
    const quality = data.quality;

    // Encoding process start karein
    await runEncoding(imageData, format, quality);
};

async function runEncoding(imageData, format, quality) {
    try {
        let resultBuffer;

        if (format === 'avif') {
            resultBuffer = await encodeAvif(imageData, quality);
        } else if (format === 'jxl') {
            resultBuffer = await encodeJxl(imageData, quality);
        } else {
            throw new Error("Format " + format + " support nahi hai.");
        }

        const blob = new Blob([resultBuffer], { type: "image/" + format });
        self.postMessage({ success: true, blob: blob });

    } catch (error) {
        console.error("Worker Error:", error);
        self.postMessage({ success: false, error: error.message });
    }
}

async function encodeAvif(imageData, quality) {
    // Dynamic import – works because worker is type: 'module'
    const { default: initAvif } = await import('/wasm/avif/avif_enc.js');
    
    const module = await initAvif({
        locateFile(path) { 
            return "/wasm/avif/" + path; 
        }
    });

    const rawPixels = new Uint8Array(imageData.data.buffer);
    const options = {
        quality: Math.round(quality * 100),
        qualityAlpha: -1,
        tileRowsLog2: 0,
        tileColsLog2: 0,
        speed: 6,
        subsample: 1,
        chromaDeltaQ: false,
        sharpness: 0,
        tune: 0,
        denoiseLevel: 0,
        enableSharpYUV: false
    };

    const result = module.encode(rawPixels, imageData.width, imageData.height, options);
    if (!result) throw new Error("AVIF encoding fail ho gayi.");
    
    const outputBuffer = new Uint8Array(result);
    if (module.free_result) module.free_result(); 
    return outputBuffer;
}

async function encodeJxl(imageData, quality) {
    const { default: initJxl } = await import('/wasm/jxl/jxl_enc.js');
    
    const module = await initJxl({
        locateFile(path) { 
            return "/wasm/jxl/" + path; 
        }
    });

    const rawPixels = new Uint8Array(imageData.data.buffer);
    const options = {
        speed: 7,
        quality: quality * 100,
        progressive: false,
        epf: -1,
        nearLossless: 0,
        lossyPalette: false,
        decodingSpeedTier: 0
    };

    const result = module.encode(rawPixels, imageData.width, imageData.height, options);
    if (!result) throw new Error("JXL encoding fail ho gayi.");

    const outputBuffer = new Uint8Array(result);
    if (module.free_result) module.free_result();
    return outputBuffer;
}

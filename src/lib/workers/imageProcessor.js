// src/lib/workers/imageProcessor.js

self.onmessage = function(event) {
    var data = event.data;
    var imageData = data.imageData;
    var format = data.format;
    var quality = data.quality;

    // Encoding process start karein
    runEncoding(imageData, format, quality);
};

async function runEncoding(imageData, format, quality) {
    try {
        var resultBuffer;

        if (format === 'avif') {
            resultBuffer = await encodeAvif(imageData, quality);
        } else if (format === 'jxl') {
            resultBuffer = await encodeJxl(imageData, quality);
        } else {
            throw new Error("Format " + format + " support nahi hai.");
        }

        var blob = new Blob([resultBuffer], { type: "image/" + format });
        self.postMessage({ success: true, blob: blob });

    } catch (error) {
        console.error("Worker Error:", error);
        self.postMessage({ success: false, error: error.message });
    }
}

async function encodeAvif(imageData, quality) {
    importScripts('/wasm/avif/avif_enc.js');
    
    // ES6 Shorthand for locateFile (Build fix)
    var module = await avif_enc({
        locateFile(path) { 
            return "/wasm/avif/" + path; 
        }
    });

    var rawPixels = new Uint8Array(imageData.data.buffer);
    var options = {
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

    var result = module.encode(rawPixels, imageData.width, imageData.height, options);
    if (!result) throw new Error("AVIF encoding fail ho gayi.");
    
    var outputBuffer = new Uint8Array(result);
    if (module.free_result) module.free_result(); 
    return outputBuffer;
}

async function encodeJxl(imageData, quality) {
    importScripts('/wasm/jxl/jxl_enc.js');
    
    var module = await jxl_enc({
        locateFile(path) { 
            return "/wasm/jxl/" + path; 
        }
    });

    var rawPixels = new Uint8Array(imageData.data.buffer);
    var options = {
        speed: 7,
        quality: quality * 100,
        progressive: false,
        epf: -1,
        nearLossless: 0,
        lossyPalette: false,
        decodingSpeedTier: 0
    };

    var result = module.encode(rawPixels, imageData.width, imageData.height, options);
    if (!result) throw new Error("JXL encoding fail ho gayi.");

    var outputBuffer = new Uint8Array(result);
    if (module.free_result) module.free_result();
    return outputBuffer;
}

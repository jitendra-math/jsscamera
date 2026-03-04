// src/lib/workers/imageProcessor.js

/**
 * JSS ORIGINALS Camera - Image Processing Worker
 * Yeh worker AVIF aur JXL encoding handle karta hai.
 * "Classic Worker" mode ke liye parser-safe vanilla syntax.
 */

// 1. Main entry point (No arrow function for maximum compatibility)
self.onmessage = function(event) {
    var data = event.data; [span_1](start_span)// Destructuring avoid ki gayi hai[span_1](end_span)
    var imageData = data.imageData;
    var format = data.format;
    var quality = data.quality;

    // Async process ko trigger karein
    handleEncoding(imageData, format, quality);
};

async function handleEncoding(imageData, format, quality) {
    try {
        var resultBuffer;

        if (format === 'avif') {
            resultBuffer = await encodeAvif(imageData, quality); [span_2](start_span)//[span_2](end_span)
        } else if (format === 'jxl') {
            resultBuffer = await encodeJxl(imageData, quality); [span_3](start_span)//[span_3](end_span)
        } else {
            throw new Error("Format " + format + " supported nahi hai."); [span_4](start_span)//[span_4](end_span)
        }

        var blob = new Blob([resultBuffer], { type: "image/" + format }); [span_5](start_span)//[span_5](end_span)
        self.postMessage({ success: true, blob: blob }); [span_6](start_span)//[span_6](end_span)

    } catch (error) {
        console.error("Worker Error:", error); [span_7](start_span)//[span_7](end_span)
        self.postMessage({ success: false, error: error.message }); [span_8](start_span)//[span_8](end_span)
    }
}

async function encodeAvif(imageData, quality) {
    [span_9](start_span)// static/wasm/avif/avif_enc.js se wrapper load karein[span_9](end_span)
    importScripts('/wasm/avif/avif_enc.js'); 
    
    var module = await avif_enc({
        [span_10](start_span)locateFile: function(path) { return "/wasm/avif/" + path; } //[span_10](end_span)
    });

    var rawPixels = new Uint8Array(imageData.data.buffer); [span_11](start_span)//[span_11](end_span)

    var options = {
        [span_12](start_span)quality: Math.round(quality * 100), //[span_12](end_span)
        [span_13](start_span)qualityAlpha: -1, //[span_13](end_span)
        [span_14](start_span)tileRowsLog2: 0, //[span_14](end_span)
        [span_15](start_span)tileColsLog2: 0, //[span_15](end_span)
        [span_16](start_span)speed: 6, //[span_16](end_span)
        [span_17](start_span)subsample: 1, //[span_17](end_span)
        [span_18](start_span)chromaDeltaQ: false, //[span_18](end_span)
        [span_19](start_span)sharpness: 0, //[span_19](end_span)
        [span_20](start_span)tune: 0, //[span_20](end_span)
        [span_21](start_span)denoiseLevel: 0, //[span_21](end_span)
        [span_22](start_span)enableSharpYUV: false //[span_22](end_span)
    };

    var result = module.encode(rawPixels, imageData.width, imageData.height, options); [span_23](start_span)//[span_23](end_span)
    
    if (!result) throw new Error("AVIF encoding fail ho gayi."); [span_24](start_span)//[span_24](end_span)
    
    var outputBuffer = new Uint8Array(result); [span_25](start_span)//[span_25](end_span)
    
    if (module.free_result) module.free_result(); [span_26](start_span)// Memory free karein[span_26](end_span)
    
    return outputBuffer;
}

async function encodeJxl(imageData, quality) {
    importScripts('/wasm/jxl/jxl_enc.js'); [span_27](start_span)//[span_27](end_span)
    
    var module = await jxl_enc({
        [span_28](start_span)locateFile: function(path) { return "/wasm/jxl/" + path; } //[span_28](end_span)
    });

    var rawPixels = new Uint8Array(imageData.data.buffer); [span_29](start_span)//[span_29](end_span)

    var options = {
        [span_30](start_span)speed: 7, //[span_30](end_span)
        [span_31](start_span)quality: quality * 100, //[span_31](end_span)
        [span_32](start_span)progressive: false, //[span_32](end_span)
        [span_33](start_span)epf: -1, //[span_33](end_span)
        [span_34](start_span)nearLossless: 0, //[span_34](end_span)
        [span_35](start_span)lossyPalette: false, //[span_35](end_span)
        [span_36](start_span)decodingSpeedTier: 0 //[span_36](end_span)
    };

    var result = module.encode(rawPixels, imageData.width, imageData.height, options); [span_37](start_span)//[span_37](end_span)
    
    if (!result) throw new Error("JXL encoding fail ho gayi."); [span_38](start_span)//[span_38](end_span)

    var outputBuffer = new Uint8Array(result); [span_39](start_span)//[span_39](end_span)
    
    if (module.free_result) module.free_result(); [span_40](start_span)//[span_40](end_span)
    
    return outputBuffer;
}

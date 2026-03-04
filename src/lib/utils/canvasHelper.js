// src/lib/utils/canvasHelper.js

/**
 * Video element se current frame ko highest quality mein canvas par capture karta hai
 * @param {HTMLVideoElement} videoElement - Svelte component ka video tag
 * @returns {HTMLCanvasElement} - Full resolution canvas return karta hai
 */
export function captureFrameToCanvas(videoElement) {
    if (!videoElement || videoElement.videoWidth === 0) {
        throw new Error("Video element ready nahi hai ya stream nahi chal rahi.");
    }

    const canvas = document.createElement('canvas');
    
    // Yahan hum intrinsic resolution use kar rahe hain full quality ke liye
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;

    const ctx = canvas.getContext('2d');
    
    // Image smoothing high rakhne se quality maintain rehti hai
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Video ke current frame ko canvas par draw karo
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

    return canvas;
}

/**
 * Canvas ko natively supported formats (PNG, JPEG, WebP) mein convert karta hai
 * @param {HTMLCanvasElement} canvas - Captured canvas
 * @param {string} mimeType - 'image/png', 'image/jpeg', 'image/webp'
 * @param {number} quality - 0.1 se 1.0 tak (1.0 = Max Quality)
 * @returns {Promise<Blob>} - Image file ka Blob data
 */
export function exportNativeFormat(canvas, mimeType = 'image/png', quality = 1.0) {
    return new Promise((resolve, reject) => {
        try {
            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error("Image process hone mein error aayi."));
                }
            }, mimeType, quality);
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Canvas se raw pixel data nikalta hai (AVIF aur JXL encoders ke liye zaroori)
 * @param {HTMLCanvasElement} canvas - Captured canvas
 * @returns {ImageData} - Raw pixels array
 */
export function getRawImageData(canvas) {
    const ctx = canvas.getContext('2d');
    // Worker file ko pass karne ke liye raw RGBA data return karo
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

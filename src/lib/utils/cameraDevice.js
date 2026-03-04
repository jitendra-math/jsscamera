// src/lib/utils/cameraDevice.js

/**
 * Camera start karne aur video stream ko element mein attach karne ka function
 * @param {HTMLVideoElement} videoElement - Svelte component ka video tag reference
 * @returns {Promise<MediaStream>} - Camera ka stream return karta hai
 */
export async function startCamera(videoElement) {
    // Agar browser mediaDevices support nahi karta (unlikely in modern browsers)
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Aapka browser camera access support nahi karta.");
    }

    try {
        // High quality aur back camera ke constraints
        const constraints = {
            video: {
                facingMode: "environment", 
                width: { ideal: 4096, max: 8192 },
                height: { ideal: 2160, max: 4320 }
            },
            audio: false // Sirf image leni hai, toh audio off
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);

        // Agar video element pass kiya gaya hai, toh stream usme laga do
        if (videoElement) {
            videoElement.srcObject = stream;
            // Jab metadata load ho jaye, tabhi play karo taaki blank screen na aaye
            videoElement.onloadedmetadata = () => {
                videoElement.play().catch(e => console.error("Video play error:", e));
            };
        }

        return stream;

    } catch (error) {
        console.error("Camera access failed:", error);
        throw new Error(handleCameraError(error));
    }
}

/**
 * Camera band karne ka function taaki battery/memory bache
 * @param {MediaStream} stream - Jo stream startCamera se mili thi
 */
export function stopCamera(stream) {
    if (stream) {
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
    }
}

/**
 * Common camera errors ko user-friendly messages mein convert karna
 */
function handleCameraError(error) {
    if (error.name === 'NotAllowedError') {
        return "Aapne camera permission deny kar di hai. Browser settings mein jaakar allow karein.";
    }
    if (error.name === 'NotFoundError') {
        return "Aapke device mein koi camera nahi mila.";
    }
    if (error.name === 'NotReadableError') {
        return "Camera shayad pehle se hi kisi aur app (jaise Zoom/Meet) mein use ho raha hai.";
    }
    return "Camera start karne mein error aayi: " + error.message;
}

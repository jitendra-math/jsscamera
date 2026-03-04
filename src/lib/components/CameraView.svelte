<script>
    import { onMount, onDestroy, createEventDispatcher } from 'svelte';
    import { startCamera, stopCamera } from '$lib/utils/cameraDevice.js';
    import { captureFrameToCanvas } from '$lib/utils/canvasHelper.js';

    const dispatch = createEventDispatcher();

    let videoElement;
    let stream;
    let errorMessage = '';
    let isCameraReady = false;

    // Component load hote hi camera start karo
    onMount(async () => {
        try {
            stream = await startCamera(videoElement);
            isCameraReady = true;
        } catch (err) {
            errorMessage = err.message;
        }
    });

    // Component hatne par camera band karo taaki background mein light na jalti rahe
    onDestroy(() => {
        if (stream) {
            stopCamera(stream);
        }
    });

    function takePhoto() {
        if (!isCameraReady) return;
        
        try {
            const canvas = captureFrameToCanvas(videoElement);
            // Captured canvas ko aage process/export karne ke liye parent ko bhej do
            dispatch('capture', { canvas });
        } catch (err) {
            errorMessage = "Photo click karne mein error aayi: " + err.message;
        }
    }
</script>

<div class="relative w-full h-[80vh] md:h-[600px] bg-neutral-900 overflow-hidden rounded-2xl shadow-2xl">
    
    {#if errorMessage}
        <div class="absolute inset-0 flex items-center justify-center bg-black/90 p-6 text-center z-20">
            <p class="text-red-400 text-lg font-semibold">{errorMessage}</p>
        </div>
    {/if}

    <video 
        bind:this={videoElement} 
        class="w-full h-full object-cover transition-opacity duration-500 {isCameraReady ? 'opacity-100' : 'opacity-0'}"
        autoplay 
        playsinline
    ></video>

    {#if !isCameraReady && !errorMessage}
        <div class="absolute inset-0 flex items-center justify-center z-10">
            <div class="text-white flex flex-col items-center space-y-3">
                <div class="w-8 h-8 border-4 border-gray-400 border-t-white rounded-full animate-spin"></div>
                <p class="animate-pulse font-medium tracking-wide">Camera start ho raha hai...</p>
            </div>
        </div>
    {/if}

    {#if isCameraReady}
        <div class="absolute bottom-8 left-0 right-0 flex justify-center z-20">
            <button 
                on:click={takePhoto}
                class="w-20 h-20 bg-white/90 rounded-full border-[5px] border-neutral-300 shadow-[0_0_20px_rgba(0,0,0,0.6)] active:scale-90 transition-transform duration-150 flex items-center justify-center hover:bg-white backdrop-blur-sm"
                aria-label="Click Photo"
            >
                <div class="w-[60px] h-[60px] rounded-full border-2 border-neutral-800"></div>
            </button>
        </div>
    {/if}
</div>

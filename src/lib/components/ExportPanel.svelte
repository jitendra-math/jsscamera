<script>
    import { createEventDispatcher, onMount } from 'svelte';
    import { exportNativeFormat, getRawImageData } from '$lib/utils/canvasHelper.js';

    export let canvas; // Captured full-res canvas parent se aayega
    
    const dispatch = createEventDispatcher();

    let previewUrl = '';
    let selectedFormat = 'webp'; // Default format
    let quality = 0.9; // 90% default quality
    let isProcessing = false;
    let errorMessage = '';

    const formats = [
        { id: 'png', label: 'PNG (Lossless)', ext: 'png' },
        { id: 'jpeg', label: 'JPEG', ext: 'jpg' },
        { id: 'webp', label: 'WebP', ext: 'webp' },
        { id: 'avif', label: 'AVIF (Next-Gen)', ext: 'avif' },
        { id: 'jxl', label: 'JPEG XL', ext: 'jxl' }
    ];

    // UI preview ke liye ek low-res image banana taaki app smooth chale
    onMount(async () => {
        if (canvas) {
            try {
                const blob = await exportNativeFormat(canvas, 'image/jpeg', 0.5);
                previewUrl = URL.createObjectURL(blob);
            } catch (err) {
                console.error("Preview load nahi hua:", err);
            }
        }
    });

    async function handleDownload() {
        if (!canvas) return;
        isProcessing = true;
        errorMessage = '';

        try {
            let finalBlob;
            
            if (['png', 'jpeg', 'webp'].includes(selectedFormat)) {
                // Native formats
                const mimeType = `image/${selectedFormat}`;
                // PNG compression/quality ignore karta hai, par baakiyon ke liye set hoga
                finalBlob = await exportNativeFormat(canvas, mimeType, quality);
            } else {
                // Advanced formats AVIF aur JXL - Web Worker ke through
                finalBlob = await processAdvancedFormat(selectedFormat, quality);
            }

            triggerDownload(finalBlob, selectedFormat);
        } catch (err) {
            errorMessage = err.message || "File export karne mein error aayi.";
        } finally {
            isProcessing = false;
        }
    }

    function processAdvancedFormat(format, exportQuality) {
        return new Promise((resolve, reject) => {
            const worker = new Worker(new URL('$lib/workers/imageProcessor.js', import.meta.url), { type: 'module' });
            
            worker.onmessage = (event) => {
                const { success, blob, error } = event.data;
                worker.terminate(); // Memory free karne ke liye worker close karein
                if (success) resolve(blob);
                else reject(new Error(error));
            };

            worker.onerror = (err) => {
                worker.terminate();
                reject(new Error("Worker fail ho gaya: " + err.message));
            };

            const imageData = getRawImageData(canvas);
            worker.postMessage({ imageData, format, quality: exportQuality });
        });
    }

    function triggerDownload(blob, ext) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        // Clean and branded file name
        a.download = `jss-originals-cam-${Date.now()}.${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function retakePhoto() {
        dispatch('retake');
    }
</script>

<div class="flex flex-col md:flex-row gap-6 p-6 bg-neutral-900 rounded-2xl shadow-xl max-w-4xl mx-auto text-white">
    
    <div class="flex-1 bg-black rounded-xl overflow-hidden flex items-center justify-center min-h-[300px] border border-neutral-800">
        {#if previewUrl}
            <img src={previewUrl} alt="Captured Preview" class="max-w-full max-h-[500px] object-contain" />
        {:else}
            <p class="text-neutral-500">Preview load ho raha hai...</p>
        {/if}
    </div>

    <div class="flex-1 flex flex-col gap-6">
        <div>
            <h2 class="text-xl font-bold mb-4">Export Settings</h2>
            
            <label class="block text-sm text-neutral-400 mb-2">Select Format:</label>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {#each formats as fmt}
                    <button 
                        class="px-3 py-2 text-sm font-medium rounded-lg border transition-all duration-200 {selectedFormat === fmt.id ? 'bg-blue-600 border-blue-500 text-white' : 'bg-neutral-800 border-neutral-700 hover:bg-neutral-700 text-neutral-300'}"
                        on:click={() => selectedFormat = fmt.id}
                        disabled={isProcessing}
                    >
                        {fmt.label}
                    </button>
                {/each}
            </div>
        </div>

        {#if selectedFormat !== 'png'}
            <div>
                <div class="flex justify-between mb-2">
                    <label class="text-sm text-neutral-400">Quality:</label>
                    <span class="text-sm font-bold text-blue-400">{Math.round(quality * 100)}%</span>
                </div>
                <input 
                    type="range" 
                    min="0.1" 
                    max="1.0" 
                    step="0.05" 
                    bind:value={quality} 
                    disabled={isProcessing}
                    class="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
            </div>
        {/if}

        {#if errorMessage}
            <div class="p-3 bg-red-900/50 border border-red-500/50 rounded-lg text-red-200 text-sm">
                {errorMessage}
            </div>
        {/if}

        <div class="flex gap-4 mt-auto pt-4 border-t border-neutral-800">
            <button 
                on:click={retakePhoto}
                disabled={isProcessing}
                class="flex-1 py-3 px-4 bg-neutral-800 hover:bg-neutral-700 rounded-xl font-medium transition-colors disabled:opacity-50"
            >
                Retake
            </button>
            
            <button 
                on:click={handleDownload}
                disabled={isProcessing}
                class="flex-[2] py-3 px-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
                {#if isProcessing}
                    <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Processing...
                {:else}
                    Download High-Res
                {/if}
            </button>
        </div>
    </div>
</div>

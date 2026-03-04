<script>
    import { onMount } from 'svelte';
    import { exportNativeFormat, getRawImageData } from '$lib/utils/canvasHelper.js';

    // Svelte 5 Props
    let { canvas, onretake } = $props(); 
    
    // Svelte 5 Runes (State Management)
    let previewUrl = $state('');
    let selectedFormat = $state('webp');
    let quality = $state(0.9);
    let isProcessing = $state(false);
    let errorMessage = $state('');

    const formats = [
        { id: 'png', label: 'PNG (Lossless)', ext: 'png' },
        { id: 'jpeg', label: 'JPEG', ext: 'jpg' },
        { id: 'webp', label: 'WebP', ext: 'webp' },
        { id: 'avif', label: 'AVIF (Next-Gen)', ext: 'avif' },
        { id: 'jxl', label: 'JPEG XL', ext: 'jxl' }
    ];

    // Preview generation on mount
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
                const mimeType = `image/${selectedFormat}`;
                finalBlob = await exportNativeFormat(canvas, mimeType, quality);
            } else {
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
            // FIX: Removed { type: 'module' } to support importScripts inside worker
            const worker = new Worker(new URL('$lib/workers/imageProcessor.js', import.meta.url));
            
            worker.onmessage = (event) => {
                const { success, blob, error } = event.data;
                worker.terminate();
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
        a.download = `jss-originals-cam-${Date.now()}.${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
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
            
            <p class="text-sm text-neutral-400 mb-2">Select Format:</p>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {#each formats as fmt}
                    <button 
                        class="px-3 py-2 text-sm font-medium rounded-lg border transition-all duration-200 {selectedFormat === fmt.id ? 'bg-blue-600 border-blue-500 text-white' : 'bg-neutral-800 border-neutral-700 hover:bg-neutral-700 text-neutral-300'}"
                        onclick={() => selectedFormat = fmt.id}
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
                    <label for="quality-slider" class="text-sm text-neutral-400">Quality:</label>
                    <span class="text-sm font-bold text-blue-400">{Math.round(quality * 100)}%</span>
                </div>
                <input 
                    id="quality-slider"
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
                onclick={onretake}
                disabled={isProcessing}
                class="flex-1 py-3 px-4 bg-neutral-800 hover:bg-neutral-700 rounded-xl font-medium transition-colors disabled:opacity-50"
            >
                Retake
            </button>
            
            <button 
                onclick={handleDownload}
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

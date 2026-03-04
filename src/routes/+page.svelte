<script>
    import CameraView from '$lib/components/CameraView.svelte';
    import ExportPanel from '$lib/components/ExportPanel.svelte';

    // Svelte 5 Rune: capturedCanvas ko reactive state banaya
    let capturedCanvas = $state(null);

    // CameraView se canvas receive karne ka function
    function handleCapture(canvas) {
        capturedCanvas = canvas;
    }

    // ExportPanel se wapas camera par aane ka function
    function handleRetake() {
        capturedCanvas = null;
    }
</script>

<svelte:head>
    <title>Studio | JSS ORIGINALS</title>
    <meta name="description" content="Capture high quality raw images directly from browser." />
</svelte:head>

<div class="w-full flex flex-col gap-4 animate-in fade-in duration-500">
    
    {#if !capturedCanvas}
        <div class="flex flex-col gap-1 mb-2">
            <h2 class="text-2xl font-bold text-white tracking-wide">Capture Image</h2>
            <p class="text-neutral-400 text-sm">Full hardware resolution unlocked.</p>
        </div>
        
        <CameraView oncapture={handleCapture} />
        
    {:else}
        <div class="flex flex-col gap-1 mb-2">
            <h2 class="text-2xl font-bold text-white tracking-wide">Process & Export</h2>
            <p class="text-neutral-400 text-sm">Choose your preferred next-gen format.</p>
        </div>
        
        <ExportPanel canvas={capturedCanvas} onretake={handleRetake} />
    {/if}

</div>

<script>
    // Global Tailwind CSS import
    import '../app.css';
</script>

<div class="min-h-screen bg-neutral-900 text-white flex flex-col font-sans selection:bg-blue-500/30">
    
    <header class="p-4 border-b border-neutral-800 bg-black/60 backdrop-blur-lg sticky top-0 z-50">
        <div class="max-w-4xl mx-auto flex justify-between items-center">
            <h1 class="text-xl font-extrabold tracking-widest bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                JSS ORIGINALS
            </h1>
            <div class="flex items-center gap-2">
                <span class="relative flex h-2 w-2">
                    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span class="text-xs font-bold tracking-wider px-2 py-1 bg-neutral-800 rounded-md text-neutral-300">
                    RAW CAM
                </span>
            </div>
        </div>
    </header>

    <main class="flex-grow p-4 md:p-8 flex flex-col w-full max-w-5xl mx-auto">
        <slot />
    </main>
    
</div>

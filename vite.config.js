// vite.config.js
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	worker: {
		format: 'es',                     // required for dynamic import()
		rollupOptions: {
			external: [
				'/wasm/avif/avif_enc.js',
				'/wasm/jxl/jxl_enc.js'
			]
		}
	}
});

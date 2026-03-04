import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Tailwind CSS aur doosre preprocessors ko handle karne ke liye
	preprocess: vitePreprocess(),

	kit: {
		// adapter-auto Vercel deployment ke liye best hai
		adapter: adapter()
	}
};

export default config;

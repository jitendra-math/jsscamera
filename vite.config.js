import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	worker: {
		/* FIX: 'es' ki jagah 'iife' use kar rahe hain. 
		   Yeh zaroori hai taaki imageProcessor.js mein 
		   importScripts() bina kisi error ke kaam kare.
		*/
		format: 'iife' 
	}
});

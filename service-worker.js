// src/service-worker.js

import { build, files, version } from '$service-worker';

// Har naye update ke liye ek unique cache name banega
const CACHE = `jss-cam-cache-${version}`;

// Saari files jo offline chalne ke liye zaroori hain
const ASSETS = [
	...build, // SvelteKit ki generated files (JS/CSS)
	...files  // Static folder ka saara data (Favicon, Wasm files, etc.)
];

// 1. Install Event: App open hote hi sab kuch cache mein save kar lo
self.addEventListener('install', (event) => {
	async function addFilesToCache() {
		const cache = await caches.open(CACHE);
		await cache.addAll(ASSETS);
	}
	event.waitUntil(addFilesToCache());
});

// 2. Activate Event: Naya update aane par purana cache delete kar do
self.addEventListener('activate', (event) => {
	async function deleteOldCaches() {
		for (const key of await caches.keys()) {
			if (key !== CACHE) await caches.delete(key);
		}
	}
	event.waitUntil(deleteOldCaches());
});

// 3. Fetch Event: Jab bhi app koi file maange, pehle cache check karo
self.addEventListener('fetch', (event) => {
	if (event.request.method !== 'GET') return;

	async function respond() {
		const url = new URL(event.request.url);
		const cache = await caches.open(CACHE);

		// Agar file humare pre-cached ASSETS mein hai, toh seedha cache se do (Super Fast)
		if (ASSETS.includes(url.pathname)) {
			const response = await cache.match(event.request);
			if (response) {
				return response;
			}
		}

		// Baaki sabhi requests ke liye pehle internet check karo, fail hone par cache use karo
		try {
			const response = await fetch(event.request);
			// Nayi file mili toh cache mein update kar do
			if (response.status === 200) {
				cache.put(event.request, response.clone());
			}
			return response;
		} catch (err) {
			// Agar user offline hai, toh purani cached file dikha do
			const response = await cache.match(event.request);
			if (response) {
				return response;
			}
			throw err;
		}
	}

	event.respondWith(respond());
});

import adapter from '@sveltejs/adapter-vercel';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			// Optional: configure runtime
			runtime: 'nodejs18.x'
		})
	}
};

export default config;
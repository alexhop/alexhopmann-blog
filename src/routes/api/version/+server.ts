import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { BUILD_VERSION, BUILD_TIMESTAMP, BUILD_FEATURES } from '$lib/version';

export const GET: RequestHandler = async () => {
	return json({
		version: BUILD_VERSION,
		timestamp: BUILD_TIMESTAMP,
		features: BUILD_FEATURES,
		environment: process.env.NODE_ENV || 'development',
		serverTime: new Date().toISOString()
	});
};
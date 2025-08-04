import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ locals, cookies }) => {
	const token = cookies.get('auth-token');
	
	return json({
		hasToken: !!token,
		tokenLength: token?.length || 0,
		user: locals.user || null,
		timestamp: new Date().toISOString()
	});
};
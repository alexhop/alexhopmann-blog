import type { Handle } from '@sveltejs/kit';
import { verifyToken } from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
	// Get the auth token from cookies
	const token = event.cookies.get('auth-token');
	
	if (token) {
		const payload = verifyToken(token);
		if (payload) {
			event.locals.user = {
				id: payload.userId,
				email: payload.email,
				name: payload.name,
				roles: payload.roles
			};
		}
	}
	
	const response = await resolve(event);
	return response;
};
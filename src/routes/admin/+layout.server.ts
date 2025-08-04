import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { hasRole } from '$lib/server/auth';
import { isAuthorizedEmail } from '$lib/server/authorized-users';

export const load: LayoutServerLoad = async ({ locals }) => {
	// Check if user is logged in
	if (!locals.user) {
		redirect(303, '/auth/login');
	}
	
	// Double-check that the user is authorized
	if (!isAuthorizedEmail(locals.user.email)) {
		console.warn(`Unauthorized access attempt to admin by: ${locals.user.email}`);
		redirect(303, '/auth/login?error=unauthorized');
	}
	
	// Check if user has required role
	if (!hasRole(locals.user, 'author')) {
		redirect(303, '/auth/login?error=unauthorized');
	}
	
	return {
		user: locals.user
	};
};
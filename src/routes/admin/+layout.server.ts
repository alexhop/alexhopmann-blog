import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { hasRole } from '$lib/server/auth';

export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.user || !hasRole(locals.user, 'author')) {
		redirect(303, '/auth/login');
	}
	
	return {
		user: locals.user
	};
};
import type { PageServerLoad } from './$types';
import { getPageBySlug } from '$lib/server/pages';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
	const page = await getPageBySlug(params.slug);
	
	if (!page || page.status !== 'published') {
		throw error(404, 'Page not found');
	}
	
	return {
		page
	};
};
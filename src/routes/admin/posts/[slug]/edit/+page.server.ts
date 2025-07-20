import type { PageServerLoad } from './$types';
import { getPostBySlug } from '$lib/server/posts';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
	const post = await getPostBySlug(params.slug);
	
	if (!post) {
		error(404, 'Post not found');
	}
	
	return {
		post
	};
};
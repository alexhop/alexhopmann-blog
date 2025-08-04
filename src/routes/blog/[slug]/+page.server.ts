import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { getPostBySlug } from '$lib/server/posts';

export const load: PageServerLoad = async ({ params }) => {
	try {
		const post = await getPostBySlug(params.slug);
		
		if (post && post.status === 'published') {
			return { post };
		}
	} catch (e) {
		console.error('Error loading post:', e);
	}
	
	error(404, 'Post not found');
};
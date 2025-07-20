import type { PageServerLoad } from './$types';
import { getPostBySlug, incrementPostViews } from '$lib/server/posts';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
	const post = await getPostBySlug(params.slug);
	
	if (!post || post.status !== 'published') {
		error(404, 'Post not found');
	}
	
	// Increment views
	incrementPostViews(post.id, post.slug).catch(console.error);
	
	return {
		post
	};
};
import type { PageServerLoad } from './$types';
import { getPostBySlug, getAllPosts } from '$lib/server/posts';
import { error } from '@sveltejs/kit';
import type { EntryGenerator } from './$types';

export const prerender = true;

export const entries: EntryGenerator = async () => {
	const posts = await getAllPosts('published');
	return posts.map(post => ({ slug: post.slug }));
};

export const load: PageServerLoad = async ({ params }) => {
	const post = await getPostBySlug(params.slug);
	
	if (!post || post.status !== 'published') {
		error(404, 'Post not found');
	}
	
	return {
		post
	};
};
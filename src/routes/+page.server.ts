import type { PageServerLoad } from './$types';
import { getAllPosts } from '$lib/server/posts';

export const prerender = true;

export const load: PageServerLoad = async () => {
	const posts = await getAllPosts('published');
	const recentPosts = posts.slice(0, 3);
	
	return {
		recentPosts
	};
};
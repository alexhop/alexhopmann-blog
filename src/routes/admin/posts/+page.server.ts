import type { PageServerLoad } from './$types';
import { getAllPosts } from '$lib/server/posts';

export const load: PageServerLoad = async () => {
	try {
		const posts = await getAllPosts();
		console.log(`Admin: Loaded ${posts.length} posts`);
		
		return {
			posts
		};
	} catch (error) {
		console.error('Admin: Error loading posts:', error);
		return {
			posts: []
		};
	}
};
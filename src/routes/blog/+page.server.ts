import type { PageServerLoad } from './$types';
import { getAllPosts } from '$lib/server/posts';

export const load: PageServerLoad = async () => {
	try {
		const posts = await getAllPosts('published');
		return {
			posts
		};
	} catch (error) {
		console.error('Error loading posts from Cosmos DB:', error);
		return {
			posts: []
		};
	}
};
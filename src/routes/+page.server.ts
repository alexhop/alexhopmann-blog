import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
	try {
		const response = await fetch('/data/posts.json');
		if (response.ok) {
			const data = await response.json();
			const recentPosts = (data.posts || []).slice(0, 3);
			return {
				recentPosts
			};
		}
	} catch (error) {
		console.error('Error loading posts:', error);
	}
	
	return {
		recentPosts: []
	};
};
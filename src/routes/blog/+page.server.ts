import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
	try {
		const response = await fetch('/data/posts.json');
		if (response.ok) {
			const data = await response.json();
			return {
				posts: data.posts || []
			};
		}
	} catch (error) {
		console.error('Error loading posts:', error);
	}
	
	return {
		posts: []
	};
};
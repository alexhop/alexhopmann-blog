import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
	try {
		// Fetch from Azure Functions API
		const response = await fetch('/api/posts');
		if (response.ok) {
			const data = await response.json();
			return {
				posts: data.posts || []
			};
		}
	} catch (error) {
		console.error('Error fetching posts:', error);
	}
	
	return {
		posts: []
	};
};
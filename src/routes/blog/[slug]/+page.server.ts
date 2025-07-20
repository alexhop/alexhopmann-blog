import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, fetch }) => {
	try {
		const response = await fetch('/data/posts.json');
		if (response.ok) {
			const data = await response.json();
			const post = data.posts.find((p: any) => p.slug === params.slug);
			
			if (post && post.status === 'published') {
				return { post };
			}
		}
	} catch (e) {
		console.error('Error loading post:', e);
	}
	
	error(404, 'Post not found');
};
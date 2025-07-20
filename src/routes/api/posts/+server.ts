import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { getAllPosts, createPost } from '$lib/server/posts';
import { hasRole } from '$lib/server/auth';

export const GET: RequestHandler = async ({ url, locals }) => {
	const status = url.searchParams.get('status') as 'draft' | 'published' | null;
	
	// Only show drafts to authenticated users
	if (status === 'draft' && !locals.user) {
		return json({ posts: [] });
	}
	
	// Public users only see published posts
	const posts = await getAllPosts(locals.user ? status || undefined : 'published');
	
	return json({ posts });
};

export const POST: RequestHandler = async ({ request, locals }) => {
	// Check authentication
	if (!locals.user || !hasRole(locals.user, 'author')) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}
	
	try {
		const data = await request.json();
		
		// Validate required fields
		if (!data.title || !data.content || !data.slug) {
			return json({ error: 'Missing required fields' }, { status: 400 });
		}
		
		// Create post
		const post = await createPost({
			...data,
			author: {
				id: locals.user.id,
				name: locals.user.name,
				email: locals.user.email
			}
		});
		
		return json({ post }, { status: 201 });
	} catch (error) {
		console.error('Error creating post:', error);
		return json({ error: 'Failed to create post' }, { status: 500 });
	}
};
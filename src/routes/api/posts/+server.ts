import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { getAllPosts, createPost } from '$lib/server/posts';
import { hasRole } from '$lib/server/auth';
import { apiRateLimiter, writeRateLimiter } from '$lib/server/rate-limit';

export const GET: RequestHandler = async (event) => {
	// Apply rate limiting
	if (!await apiRateLimiter(event)) {
		return json({ error: 'Too many requests' }, { status: 429 });
	}
	
	const { url, locals } = event;
	const status = url.searchParams.get('status') as 'draft' | 'published' | null;
	
	// Only show drafts to authenticated users
	if (status === 'draft' && !locals.user) {
		return json({ posts: [] });
	}
	
	// Public users only see published posts
	const posts = await getAllPosts(locals.user ? status || undefined : 'published');
	
	return json({ posts });
};

export const POST: RequestHandler = async (event) => {
	// Apply rate limiting for write operations
	if (!await writeRateLimiter(event)) {
		return json({ error: 'Too many requests' }, { status: 429 });
	}
	
	const { request, locals } = event;
	
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
		
		// Handle duplicate slug error
		if (error instanceof Error && error.message.includes('slug already exists')) {
			return json({ error: 'A post with this slug already exists. Please choose a different slug.' }, { status: 409 });
		}
		
		return json({ error: 'Failed to create post' }, { status: 500 });
	}
};
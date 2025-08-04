import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { getPostBySlug, updatePost, deletePost, incrementPostViews } from '$lib/server/posts';
import { hasRole } from '$lib/server/auth';

export const GET: RequestHandler = async ({ params, locals }) => {
	const post = await getPostBySlug(params.slug);
	
	if (!post) {
		return json({ error: 'Post not found' }, { status: 404 });
	}
	
	// Check if user can see draft posts
	if (post.status === 'draft' && (!locals.user || !hasRole(locals.user, 'author'))) {
		return json({ error: 'Post not found' }, { status: 404 });
	}
	
	// Increment views for published posts
	if (post.status === 'published') {
		incrementPostViews(post.id, post.slug).catch(console.error);
	}
	
	return json({ post });
};

export const PUT: RequestHandler = async ({ request, params, locals }) => {
	// Check authentication
	if (!locals.user || !hasRole(locals.user, 'author')) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}
	
	try {
		const post = await getPostBySlug(params.slug);
		if (!post) {
			return json({ error: 'Post not found' }, { status: 404 });
		}
		
		// Check if user owns the post or is admin
		if (post.author.id !== locals.user.id && !hasRole(locals.user, 'admin')) {
			return json({ error: 'Forbidden' }, { status: 403 });
		}
		
		const updates = await request.json();
		delete updates.id; // Don't allow ID updates
		delete updates.slug; // Don't allow slug updates via this endpoint
		
		const updatedPost = await updatePost(post.id, post.slug, updates);
		
		return json({ post: updatedPost });
	} catch (error) {
		console.error('Error updating post:', error);
		return json({ error: 'Failed to update post' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	// Check authentication
	if (!locals.user || !hasRole(locals.user, 'author')) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}
	
	try {
		console.log(`DELETE request for slug: ${params.slug}`);
		
		const post = await getPostBySlug(params.slug);
		if (!post) {
			console.error(`Post not found with slug: ${params.slug}`);
			return json({ error: 'Post not found' }, { status: 404 });
		}
		
		console.log(`Found post to delete - id: ${post.id}, slug: ${post.slug}, title: ${post.title}`);
		
		// Check if user owns the post or is admin
		if (post.author.id !== locals.user.id && !hasRole(locals.user, 'admin')) {
			console.error(`User ${locals.user.id} not authorized to delete post by ${post.author.id}`);
			return json({ error: 'Forbidden' }, { status: 403 });
		}
		
		await deletePost(post.id, post.slug);
		
		return json({ success: true });
	} catch (error: any) {
		console.error('Error deleting post:', error);
		
		// Return detailed error information
		const errorResponse = {
			error: 'Failed to delete post',
			details: {
				message: error.message || 'Unknown error',
				code: error.code,
				statusCode: error.statusCode,
				cosmosError: error.body ? JSON.parse(error.body) : null
			}
		};
		
		// Check for specific Cosmos DB errors
		if (error.code === 403 || error.statusCode === 403) {
			errorResponse.error = 'Database access denied - possible firewall issue';
		} else if (error.code === 404 || error.statusCode === 404) {
			errorResponse.error = 'Post not found in database';
		}
		
		return json(errorResponse, { status: 500 });
	}
};
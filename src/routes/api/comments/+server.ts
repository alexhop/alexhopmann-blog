import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { getAllComments, approveComment, deleteComment } from '$lib/server/comments';
import { hasRole } from '$lib/server/auth';

// Get all comments (admin only)
export const GET: RequestHandler = async ({ locals }) => {
	// Check if user is admin
	if (!locals.user || !hasRole(locals.user, 'admin')) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}
	
	try {
		const comments = await getAllComments();
		return json({ comments });
	} catch (error) {
		console.error('Error fetching comments:', error);
		return json({ error: 'Failed to fetch comments' }, { status: 500 });
	}
};

// Approve a comment (admin only)
export const PUT: RequestHandler = async ({ request, locals }) => {
	// Check if user is admin
	if (!locals.user || !hasRole(locals.user, 'admin')) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}
	
	try {
		const { commentId, postId } = await request.json();
		
		if (!commentId || !postId) {
			return json({ error: 'Missing required fields' }, { status: 400 });
		}
		
		const comment = await approveComment(commentId, postId);
		return json({ comment });
	} catch (error) {
		console.error('Error approving comment:', error);
		return json({ error: 'Failed to approve comment' }, { status: 500 });
	}
};

// Delete a comment (admin only)
export const DELETE: RequestHandler = async ({ request, locals }) => {
	// Check if user is admin
	if (!locals.user || !hasRole(locals.user, 'admin')) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}
	
	try {
		const { commentId, postId } = await request.json();
		
		if (!commentId || !postId) {
			return json({ error: 'Missing required fields' }, { status: 400 });
		}
		
		await deleteComment(commentId, postId);
		return json({ success: true });
	} catch (error) {
		console.error('Error deleting comment:', error);
		return json({ error: 'Failed to delete comment' }, { status: 500 });
	}
};
import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { getPostBySlug } from '$lib/server/posts';
import { getCommentThread, createComment } from '$lib/server/comments';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

// Get comments for a post
export const GET: RequestHandler = async ({ params }) => {
	try {
		// Verify post exists
		const post = await getPostBySlug(params.slug);
		if (!post || post.status !== 'published') {
			return json({ error: 'Post not found' }, { status: 404 });
		}
		
		// Get root level comments
		const comments = await getCommentThread(post.id);
		
		// For each comment, get replies
		const commentsWithReplies = await Promise.all(
			comments.map(async (comment) => {
				const replies = await getCommentThread(post.id, comment.id);
				return {
					...comment,
					replies
				};
			})
		);
		
		return json({ comments: commentsWithReplies });
	} catch (error) {
		console.error('Error fetching comments:', error);
		return json({ error: 'Failed to fetch comments' }, { status: 500 });
	}
};

// Create a new comment
export const POST: RequestHandler = async ({ request, params }) => {
	try {
		// Verify post exists
		const post = await getPostBySlug(params.slug);
		if (!post || post.status !== 'published') {
			return json({ error: 'Post not found' }, { status: 404 });
		}
		
		const data = await request.json();
		
		// Validate required fields
		if (!data.author?.name || !data.author?.email || !data.content) {
			return json({ error: 'Missing required fields' }, { status: 400 });
		}
		
		// Sanitize content
		const window = new JSDOM('').window;
		const purify = DOMPurify(window);
		const sanitizedContent = purify.sanitize(data.content, { 
			ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'a'],
			ALLOWED_ATTR: ['href', 'target', 'rel']
		});
		
		// Create comment
		const comment = await createComment({
			postId: post.id,
			author: {
				name: data.author.name,
				email: data.author.email,
				avatar: data.author.avatar
			},
			content: sanitizedContent,
			parentId: data.parentId
		});
		
		return json({ 
			comment,
			message: 'Comment submitted successfully. It will appear after approval.'
		}, { status: 201 });
	} catch (error) {
		console.error('Error creating comment:', error);
		return json({ error: 'Failed to create comment' }, { status: 500 });
	}
};
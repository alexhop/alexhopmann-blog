import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { getPostBySlug } from '$lib/server/posts';
import { shareToTwitter, shareToLinkedIn, shareToFacebook } from '$lib/server/social';
import { hasRole } from '$lib/server/auth';

export const POST: RequestHandler = async ({ request, params, locals }) => {
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
		
		const { platform } = await request.json();
		
		let result;
		switch (platform) {
			case 'twitter':
				result = await shareToTwitter(post);
				break;
			case 'linkedin':
				result = await shareToLinkedIn(post);
				break;
			case 'facebook':
				result = await shareToFacebook(post);
				break;
			default:
				return json({ error: 'Invalid platform' }, { status: 400 });
		}
		
		if (!result.success) {
			return json({ error: result.error || 'Failed to share' }, { status: 500 });
		}
		
		return json({ 
			success: true, 
			shareUrl: result.postId,
			platform 
		});
	} catch (error) {
		console.error('Error sharing post:', error);
		return json({ error: 'Failed to share post' }, { status: 500 });
	}
};
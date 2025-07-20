import type { PageServerLoad } from './$types';
import { getAllComments } from '$lib/server/comments';
import { getAllPosts } from '$lib/server/posts';

export const load: PageServerLoad = async () => {
	const [comments, posts] = await Promise.all([
		getAllComments(),
		getAllPosts()
	]);
	
	// Create a map of post IDs to titles
	const postMap = new Map(posts.map(post => [post.id, post.title]));
	
	// Add post titles to comments
	const commentsWithPosts = comments.map(comment => ({
		...comment,
		postTitle: postMap.get(comment.postId) || 'Unknown Post'
	}));
	
	return {
		comments: commentsWithPosts
	};
};
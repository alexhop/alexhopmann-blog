import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { getContainer } from '$lib/server/cosmos';
import { hasRole } from '$lib/server/auth';

export const GET: RequestHandler = async ({ locals }) => {
	// Temporarily disable auth for debugging
	// if (!locals.user || !hasRole(locals.user, 'admin')) {
	// 	return json({ error: 'Unauthorized' }, { status: 401 });
	// }
	
	try {
		const container = await getContainer('posts');
		
		// Test 1: Read posts
		const { resources: posts } = await container.items
			.query({
				query: 'SELECT * FROM c WHERE c.slug = @slug',
				parameters: [{ name: '@slug', value: 'starting-blogging-again' }]
			})
			.fetchAll();
		
		const results = {
			readTest: {
				success: true,
				postsFound: posts.length,
				postIds: posts.map(p => p.id)
			},
			updateTest: {},
			environment: {
				hasCosmosKey: !!process.env.COSMOS_KEY,
				hasCosmosEndpoint: !!process.env.COSMOS_ENDPOINT,
				cosmosDatabase: process.env.COSMOS_DATABASE
			}
		};
		
		// Test 2: Try to update
		if (posts.length > 0) {
			const post = posts[0];
			try {
				const updatedPost = {
					...post,
					debugUpdate: new Date().toISOString()
				};
				
				await container.item(post.id, post.id).replace(updatedPost);
				results.updateTest = {
					success: true,
					postId: post.id,
					message: 'Update successful'
				};
			} catch (error: any) {
				results.updateTest = {
					success: false,
					error: error.message,
					code: error.code,
					statusCode: error.statusCode,
					body: error.body
				};
			}
		}
		
		return json(results);
	} catch (error: any) {
		return json({
			error: 'Debug test failed',
			message: error.message,
			code: error.code,
			statusCode: error.statusCode
		}, { status: 500 });
	}
};
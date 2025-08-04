import { getContainer } from './cosmos';
import type { BlogPost } from '$lib/types';
import { SqlQuerySpec } from '@azure/cosmos';
import { telemetry } from './telemetry';

export async function getAllPosts(status?: 'draft' | 'published'): Promise<BlogPost[]> {
	const container = await getContainer('posts');
	
	let query: SqlQuerySpec = {
		query: 'SELECT * FROM c ORDER BY c.publishedAt DESC'
	};
	
	if (status) {
		query = {
			query: 'SELECT * FROM c WHERE c.status = @status ORDER BY c.publishedAt DESC',
			parameters: [{ name: '@status', value: status }]
		};
	}
	
	const { resources } = await container.items.query<BlogPost>(query).fetchAll();
	return resources;
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
	const container = await getContainer('posts');
	
	const query: SqlQuerySpec = {
		query: 'SELECT * FROM c WHERE c.slug = @slug ORDER BY c.publishedAt DESC',
		parameters: [{ name: '@slug', value: slug }]
	};
	
	const { resources } = await container.items.query<BlogPost>(query).fetchAll();
	
	// If there are duplicates, log a warning and return the newest
	if (resources.length > 1) {
		console.warn(`Found ${resources.length} posts with slug "${slug}". Returning the newest.`);
	}
	
	return resources.length > 0 ? resources[0] : null;
}

export async function createPost(post: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt' | 'views'>): Promise<BlogPost> {
	const container = await getContainer('posts');
	
	// Check if slug already exists
	const existingPost = await getPostBySlug(post.slug);
	if (existingPost) {
		throw new Error('A post with this slug already exists');
	}
	
	const newPost: BlogPost = {
		...post,
		id: generateId(),
		createdAt: new Date(),
		updatedAt: new Date(),
		views: 0
	};
	
	const { resource } = await container.items.create(newPost);
	
	// Track post creation
	telemetry.trackEvent({
		name: 'PostCreated',
		properties: {
			postId: newPost.id,
			slug: newPost.slug,
			status: newPost.status,
			authorId: newPost.author.id
		}
	});
	
	return resource!;
}

export async function updatePost(id: string, slug: string, updates: Partial<BlogPost>): Promise<BlogPost> {
	const container = await getContainer('posts');
	
	// In Cosmos DB with partition key /id, we need to use id as the partition key value
	const { resource: existingPost } = await container.item(id, id).read<BlogPost>();
	if (!existingPost) {
		throw new Error('Post not found');
	}
	
	const updatedPost = {
		...existingPost,
		...updates,
		id: existingPost.id,
		slug: existingPost.slug,
		createdAt: existingPost.createdAt,
		updatedAt: new Date()
	};
	
	// Use the correct partition key value (id) when replacing
	const { resource } = await container.item(id, id).replace(updatedPost);
	
	// Track post update
	telemetry.trackEvent({
		name: 'PostUpdated',
		properties: {
			postId: id,
			slug: updatedPost.slug,
			status: updatedPost.status
		}
	});
	
	return resource!;
}

export async function deletePost(id: string, slug: string): Promise<void> {
	const container = await getContainer('posts');
	
	try {
		// First, try to read the item to ensure it exists
		const { resource: existingPost } = await container.item(id, id).read<BlogPost>();
		
		if (!existingPost) {
			console.error(`Post not found for deletion - id: ${id}, slug: ${slug}`);
			throw new Error('Post not found');
		}
		
		console.log(`Deleting post - id: ${id}, slug: ${slug}`);
		
		// Delete the post
		await container.item(id, id).delete();
		
		// Track post deletion
		telemetry.trackEvent({
			name: 'PostDeleted',
			properties: {
				postId: id,
				slug: existingPost.slug
			}
		});
	} catch (error: any) {
		console.error('Delete error details:', {
			id,
			slug,
			error: error.message,
			code: error.code,
			statusCode: error.statusCode
		});
		
		// Track deletion error
		telemetry.trackException({
			error: error,
			properties: {
				operation: 'deletePost',
				postId: id,
				slug: slug,
				errorCode: error.code?.toString(),
				statusCode: error.statusCode?.toString()
			}
		});
		
		throw error;
	}
}

export async function incrementPostViews(id: string, slug: string): Promise<void> {
	const container = await getContainer('posts');
	
	const { resource: post } = await container.item(id, id).read<BlogPost>();
	if (post) {
		await container.item(id, id).replace({
			...post,
			views: (post.views || 0) + 1
		});
	}
}

function generateId(): string {
	return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
import { getContainer } from './cosmos';
import type { BlogPost } from '$lib/types';
import { SqlQuerySpec } from '@azure/cosmos';

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
		query: 'SELECT * FROM c WHERE c.slug = @slug',
		parameters: [{ name: '@slug', value: slug }]
	};
	
	const { resources } = await container.items.query<BlogPost>(query).fetchAll();
	return resources.length > 0 ? resources[0] : null;
}

export async function createPost(post: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt' | 'views'>): Promise<BlogPost> {
	const container = await getContainer('posts');
	
	const newPost: BlogPost = {
		...post,
		id: generateId(),
		createdAt: new Date(),
		updatedAt: new Date(),
		views: 0
	};
	
	const { resource } = await container.items.create(newPost);
	return resource!;
}

export async function updatePost(id: string, slug: string, updates: Partial<BlogPost>): Promise<BlogPost> {
	const container = await getContainer('posts');
	
	const { resource: existingPost } = await container.item(id, slug).read<BlogPost>();
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
	
	const { resource } = await container.item(id, slug).replace(updatedPost);
	return resource!;
}

export async function deletePost(id: string, slug: string): Promise<void> {
	const container = await getContainer('posts');
	await container.item(id, slug).delete();
}

export async function incrementPostViews(id: string, slug: string): Promise<void> {
	const container = await getContainer('posts');
	
	const { resource: post } = await container.item(id, slug).read<BlogPost>();
	if (post) {
		await container.item(id, slug).replace({
			...post,
			views: (post.views || 0) + 1
		});
	}
}

function generateId(): string {
	return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
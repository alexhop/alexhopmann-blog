import { getContainer } from './cosmos';
import type { Comment } from '$lib/types';
import { SqlQuerySpec } from '@azure/cosmos';

export async function getCommentsByPostId(postId: string, approved: boolean = true): Promise<Comment[]> {
	const container = await getContainer('comments');
	
	const query: SqlQuerySpec = {
		query: 'SELECT * FROM c WHERE c.postId = @postId AND c.approved = @approved ORDER BY c.createdAt DESC',
		parameters: [
			{ name: '@postId', value: postId },
			{ name: '@approved', value: approved }
		]
	};
	
	const { resources } = await container.items.query<Comment>(query).fetchAll();
	return resources;
}

export async function getAllComments(): Promise<Comment[]> {
	const container = await getContainer('comments');
	
	const query: SqlQuerySpec = {
		query: 'SELECT * FROM c ORDER BY c.createdAt DESC'
	};
	
	const { resources } = await container.items.query<Comment>(query).fetchAll();
	return resources;
}

export async function createComment(comment: Omit<Comment, 'id' | 'createdAt' | 'approved'>): Promise<Comment> {
	const container = await getContainer('comments');
	
	const newComment: Comment = {
		...comment,
		id: generateId(),
		createdAt: new Date(),
		approved: false // Comments require approval by default
	};
	
	const { resource } = await container.items.create(newComment);
	return resource!;
}

export async function approveComment(id: string, postId: string): Promise<Comment> {
	const container = await getContainer('comments');
	
	const { resource: existingComment } = await container.item(id, postId).read<Comment>();
	if (!existingComment) {
		throw new Error('Comment not found');
	}
	
	const updatedComment = {
		...existingComment,
		approved: true
	};
	
	const { resource } = await container.item(id, postId).replace(updatedComment);
	return resource!;
}

export async function deleteComment(id: string, postId: string): Promise<void> {
	const container = await getContainer('comments');
	await container.item(id, postId).delete();
}

export async function getCommentThread(postId: string, parentId?: string): Promise<Comment[]> {
	const container = await getContainer('comments');
	
	let query: SqlQuerySpec;
	if (parentId) {
		query = {
			query: 'SELECT * FROM c WHERE c.postId = @postId AND c.parentId = @parentId AND c.approved = true ORDER BY c.createdAt ASC',
			parameters: [
				{ name: '@postId', value: postId },
				{ name: '@parentId', value: parentId }
			]
		};
	} else {
		query = {
			query: 'SELECT * FROM c WHERE c.postId = @postId AND (NOT IS_DEFINED(c.parentId) OR c.parentId = null) AND c.approved = true ORDER BY c.createdAt DESC',
			parameters: [{ name: '@postId', value: postId }]
		};
	}
	
	const { resources } = await container.items.query<Comment>(query).fetchAll();
	return resources;
}

function generateId(): string {
	return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
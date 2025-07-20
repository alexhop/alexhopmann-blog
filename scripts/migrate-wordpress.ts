#!/usr/bin/env node
import { readFileSync } from 'fs';
import { CosmosClient } from '@azure/cosmos';
import { BlobServiceClient } from '@azure/storage-blob';
import mysql from 'mysql2/promise';
import { marked } from 'marked';
import TurndownService from 'turndown';

// Configuration
const config = {
	mysql: {
		host: process.env.MYSQL_HOST || 'localhost',
		user: process.env.MYSQL_USER || 'root',
		password: process.env.MYSQL_PASSWORD || '',
		database: process.env.MYSQL_DATABASE || 'alexhopmann'
	},
	cosmos: {
		endpoint: process.env.COSMOS_ENDPOINT || '',
		key: process.env.COSMOS_KEY || '',
		databaseId: process.env.COSMOS_DATABASE || 'alexhopmann-blog',
		postsContainer: process.env.COSMOS_CONTAINER_POSTS || 'posts',
		usersContainer: process.env.COSMOS_CONTAINER_USERS || 'users',
		commentsContainer: process.env.COSMOS_CONTAINER_COMMENTS || 'comments'
	},
	storage: {
		connectionString: `DefaultEndpointsProtocol=https;AccountName=${process.env.AZURE_STORAGE_ACCOUNT_NAME};AccountKey=${process.env.AZURE_STORAGE_ACCOUNT_KEY};EndpointSuffix=core.windows.net`,
		containerName: process.env.AZURE_STORAGE_CONTAINER_NAME || 'blog-media'
	}
};

// Initialize services
const cosmosClient = new CosmosClient({
	endpoint: config.cosmos.endpoint,
	key: config.cosmos.key
});

const blobServiceClient = BlobServiceClient.fromConnectionString(config.storage.connectionString);
const containerClient = blobServiceClient.getContainerClient(config.storage.containerName);

const turndownService = new TurndownService();

// Generate slug from title
function generateSlug(title: string): string {
	return title
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

// Upload WordPress media
async function uploadWordPressMedia(url: string): Promise<string> {
	try {
		// Check if it's a local WordPress upload
		if (url.includes('/wp-content/uploads/')) {
			const pathMatch = url.match(/wp-content\/uploads\/(.*)/);
			if (pathMatch) {
				const localPath = `../old_alexhopmann.com/wp-content/uploads/${pathMatch[1]}`;
				const imageData = readFileSync(localPath);
				const blobName = `wp-uploads/${pathMatch[1]}`;
				
				const blockBlobClient = containerClient.getBlockBlobClient(blobName);
				await blockBlobClient.upload(imageData, imageData.length);
				
				return blockBlobClient.url;
			}
		}
		return url; // Return original URL for external images
	} catch (error) {
		console.error(`Error uploading media ${url}:`, error);
		return url;
	}
}

// Process WordPress content
async function processWordPressContent(content: string): Promise<string> {
	// Find all image URLs
	const imageRegex = /<img[^>]+src="([^"]+)"/g;
	const images: string[] = [];
	let match;
	
	while ((match = imageRegex.exec(content)) !== null) {
		images.push(match[1]);
	}
	
	// Upload images and replace URLs
	let processedContent = content;
	for (const imageUrl of images) {
		const newUrl = await uploadWordPressMedia(imageUrl);
		processedContent = processedContent.replace(
			new RegExp(imageUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
			newUrl
		);
	}
	
	return processedContent;
}

// Migrate WordPress posts
async function migratePosts(connection: mysql.Connection) {
	console.log('Migrating WordPress posts...');
	
	const database = cosmosClient.database(config.cosmos.databaseId);
	const container = database.container(config.cosmos.postsContainer);
	
	const [posts] = await connection.execute(`
		SELECT 
			p.ID,
			p.post_title,
			p.post_content,
			p.post_excerpt,
			p.post_status,
			p.post_date,
			p.post_modified,
			u.display_name as author_name,
			u.user_email as author_email
		FROM wp_posts p
		JOIN wp_users u ON p.post_author = u.ID
		WHERE p.post_type = 'post' 
		AND p.post_status IN ('publish', 'draft')
		ORDER BY p.post_date DESC
	`);
	
	let successCount = 0;
	let errorCount = 0;
	
	for (const post of posts as any[]) {
		try {
			// Process content
			const processedContent = await processWordPressContent(post.post_content);
			
			// Get categories
			const [categories] = await connection.execute(`
				SELECT t.name
				FROM wp_terms t
				JOIN wp_term_taxonomy tt ON t.term_id = tt.term_id
				JOIN wp_term_relationships tr ON tt.term_taxonomy_id = tr.term_taxonomy_id
				WHERE tr.object_id = ? AND tt.taxonomy = 'category'
			`, [post.ID]);
			
			// Get tags
			const [tags] = await connection.execute(`
				SELECT t.name
				FROM wp_terms t
				JOIN wp_term_taxonomy tt ON t.term_id = tt.term_id
				JOIN wp_term_relationships tr ON tt.term_taxonomy_id = tr.term_taxonomy_id
				WHERE tr.object_id = ? AND tt.taxonomy = 'post_tag'
			`, [post.ID]);
			
			const blogPost = {
				id: `wp-${post.ID}`,
				slug: generateSlug(post.post_title),
				title: post.post_title,
				content: processedContent,
				excerpt: post.post_excerpt || processedContent.substring(0, 200).replace(/<[^>]*>/g, '') + '...',
				author: {
					id: `wp-author-${post.author_email}`,
					name: post.author_name,
					email: post.author_email
				},
				categories: (categories as any[]).map(c => c.name),
				tags: (tags as any[]).map(t => t.name),
				status: post.post_status === 'publish' ? 'published' : 'draft',
				publishedAt: new Date(post.post_date),
				createdAt: new Date(post.post_date),
				updatedAt: new Date(post.post_modified),
				views: 0
			};
			
			// Check if post already exists
			const { resources } = await container.items
				.query({
					query: 'SELECT * FROM c WHERE c.slug = @slug',
					parameters: [{ name: '@slug', value: blogPost.slug }]
				})
				.fetchAll();
			
			if (resources.length > 0) {
				console.log(`Post "${blogPost.title}" already exists, skipping...`);
				continue;
			}
			
			await container.items.create(blogPost);
			console.log(`✓ Migrated post: ${blogPost.title}`);
			successCount++;
			
		} catch (error) {
			console.error(`✗ Error migrating post ${post.ID}:`, error);
			errorCount++;
		}
	}
	
	console.log(`Posts migration complete: ${successCount} success, ${errorCount} errors`);
}

// Migrate WordPress comments
async function migrateComments(connection: mysql.Connection) {
	console.log('Migrating WordPress comments...');
	
	const database = cosmosClient.database(config.cosmos.databaseId);
	const commentsContainer = database.container(config.cosmos.commentsContainer);
	const postsContainer = database.container(config.cosmos.postsContainer);
	
	const [comments] = await connection.execute(`
		SELECT 
			c.comment_ID,
			c.comment_post_ID,
			c.comment_author,
			c.comment_author_email,
			c.comment_content,
			c.comment_date,
			c.comment_approved,
			c.comment_parent,
			p.post_title
		FROM wp_comments c
		JOIN wp_posts p ON c.comment_post_ID = p.ID
		WHERE c.comment_type = ''
		AND p.post_type = 'post'
		ORDER BY c.comment_date ASC
	`);
	
	let successCount = 0;
	let errorCount = 0;
	
	for (const comment of comments as any[]) {
		try {
			// Find the migrated post
			const postSlug = generateSlug(comment.post_title);
			const { resources: posts } = await postsContainer.items
				.query({
					query: 'SELECT * FROM c WHERE c.slug = @slug',
					parameters: [{ name: '@slug', value: postSlug }]
				})
				.fetchAll();
			
			if (posts.length === 0) {
				console.log(`Post not found for comment ${comment.comment_ID}, skipping...`);
				continue;
			}
			
			const post = posts[0];
			
			const migratedComment = {
				id: `wp-comment-${comment.comment_ID}`,
				postId: post.id,
				author: {
					name: comment.comment_author,
					email: comment.comment_author_email
				},
				content: comment.comment_content,
				createdAt: new Date(comment.comment_date),
				approved: comment.comment_approved === '1',
				parentId: comment.comment_parent > 0 ? `wp-comment-${comment.comment_parent}` : undefined
			};
			
			await commentsContainer.items.create(migratedComment);
			console.log(`✓ Migrated comment from ${comment.comment_author}`);
			successCount++;
			
		} catch (error) {
			console.error(`✗ Error migrating comment ${comment.comment_ID}:`, error);
			errorCount++;
		}
	}
	
	console.log(`Comments migration complete: ${successCount} success, ${errorCount} errors`);
}

// Migrate WordPress users
async function migrateUsers(connection: mysql.Connection) {
	console.log('Migrating WordPress users...');
	
	const database = cosmosClient.database(config.cosmos.databaseId);
	const container = database.container(config.cosmos.usersContainer);
	
	const [users] = await connection.execute(`
		SELECT 
			ID,
			user_login,
			user_email,
			display_name,
			user_registered
		FROM wp_users
		WHERE user_status = 0
	`);
	
	let successCount = 0;
	let errorCount = 0;
	
	for (const user of users as any[]) {
		try {
			// Check if user already exists
			const { resources } = await container.items
				.query({
					query: 'SELECT * FROM c WHERE c.email = @email',
					parameters: [{ name: '@email', value: user.user_email }]
				})
				.fetchAll();
			
			if (resources.length > 0) {
				console.log(`User ${user.user_email} already exists, skipping...`);
				continue;
			}
			
			const migratedUser = {
				id: `wp-user-${user.ID}`,
				email: user.user_email,
				name: user.display_name || user.user_login,
				roles: ['author'], // Default role
				createdAt: new Date(user.user_registered),
				updatedAt: new Date()
			};
			
			await container.items.create(migratedUser);
			console.log(`✓ Migrated user: ${user.user_email}`);
			successCount++;
			
		} catch (error) {
			console.error(`✗ Error migrating user ${user.ID}:`, error);
			errorCount++;
		}
	}
	
	console.log(`Users migration complete: ${successCount} success, ${errorCount} errors`);
}

// Main migration function
async function migrate() {
	console.log('Starting WordPress migration...');
	
	// Create MySQL connection
	const connection = await mysql.createConnection(config.mysql);
	
	try {
		// Ensure blob container exists
		await containerClient.createIfNotExists();
		
		// Run migrations
		await migrateUsers(connection);
		await migratePosts(connection);
		await migrateComments(connection);
		
		console.log('\nWordPress migration complete!');
	} catch (error) {
		console.error('Migration failed:', error);
	} finally {
		await connection.end();
	}
}

// Run migration
migrate().catch(console.error);
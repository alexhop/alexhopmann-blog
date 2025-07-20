#!/usr/bin/env node
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, basename } from 'path';
import { CosmosClient } from '@azure/cosmos';
import { BlobServiceClient } from '@azure/storage-blob';
import { marked } from 'marked';
import { JSDOM } from 'jsdom';
import DOMPurify from 'dompurify';

// Configuration
const config = {
	cosmos: {
		endpoint: process.env.COSMOS_ENDPOINT || '',
		key: process.env.COSMOS_KEY || '',
		databaseId: process.env.COSMOS_DATABASE || 'alexhopmann-blog',
		containerId: process.env.COSMOS_CONTAINER_POSTS || 'posts'
	},
	storage: {
		connectionString: `DefaultEndpointsProtocol=https;AccountName=${process.env.AZURE_STORAGE_ACCOUNT_NAME};AccountKey=${process.env.AZURE_STORAGE_ACCOUNT_KEY};EndpointSuffix=core.windows.net`,
		containerName: process.env.AZURE_STORAGE_CONTAINER_NAME || 'blog-media'
	},
	sourcePath: '../old_alexhopmann.com/docroot'
};

interface LegacyPost {
	title: string;
	content: string;
	date: Date;
	category?: string;
	images: string[];
}

// Initialize services
const cosmosClient = new CosmosClient({
	endpoint: config.cosmos.endpoint,
	key: config.cosmos.key
});

const blobServiceClient = BlobServiceClient.fromConnectionString(config.storage.connectionString);
const containerClient = blobServiceClient.getContainerClient(config.storage.containerName);

// Parse legacy HTML posts
function parseLegacyPost(filePath: string): LegacyPost | null {
	try {
		const content = readFileSync(filePath, 'utf-8');
		const dom = new JSDOM(content);
		const document = dom.window.document;
		
		// Extract title
		const titleElement = document.querySelector('h1, h2, title');
		const title = titleElement?.textContent?.trim() || basename(filePath, '.htm');
		
		// Extract date from filename (article YYYY-MM-DD.htm)
		const dateMatch = basename(filePath).match(/(\d{4})-(\d{2})-(\d{2})/);
		const date = dateMatch 
			? new Date(parseInt(dateMatch[1]), parseInt(dateMatch[2]) - 1, parseInt(dateMatch[3]))
			: new Date(statSync(filePath).mtime);
		
		// Extract content
		const bodyElement = document.querySelector('body');
		const contentHtml = bodyElement?.innerHTML || content;
		
		// Find images
		const images: string[] = [];
		document.querySelectorAll('img').forEach(img => {
			const src = img.getAttribute('src');
			if (src) images.push(src);
		});
		
		return {
			title,
			content: contentHtml,
			date,
			images
		};
	} catch (error) {
		console.error(`Error parsing ${filePath}:`, error);
		return null;
	}
}

// Upload image to blob storage
async function uploadImage(localPath: string, originalUrl: string): Promise<string> {
	try {
		const fullPath = join(config.sourcePath, originalUrl);
		const imageData = readFileSync(fullPath);
		const blobName = `migrated/${Date.now()}-${basename(originalUrl)}`;
		
		const blockBlobClient = containerClient.getBlockBlobClient(blobName);
		await blockBlobClient.upload(imageData, imageData.length);
		
		return blockBlobClient.url;
	} catch (error) {
		console.error(`Error uploading image ${originalUrl}:`, error);
		return originalUrl; // Return original URL as fallback
	}
}

// Process content and update image URLs
async function processContent(content: string, images: string[]): Promise<string> {
	let processedContent = content;
	
	// Upload images and replace URLs
	for (const imageUrl of images) {
		try {
			const newUrl = await uploadImage(config.sourcePath, imageUrl);
			processedContent = processedContent.replace(
				new RegExp(imageUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
				newUrl
			);
		} catch (error) {
			console.error(`Error processing image ${imageUrl}:`, error);
		}
	}
	
	// Clean and sanitize HTML
	const window = new JSDOM('').window;
	const purify = DOMPurify(window);
	const cleanHtml = purify.sanitize(processedContent, {
		ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'i', 'b', 'a', 'img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'pre', 'code'],
		ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'target', 'rel']
	});
	
	return cleanHtml;
}

// Generate slug from title
function generateSlug(title: string): string {
	return title
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

// Migrate a single post
async function migratePost(post: LegacyPost) {
	const processedContent = await processContent(post.content, post.images);
	const slug = generateSlug(post.title);
	
	// Extract excerpt (first paragraph or first 200 chars)
	const tempDiv = new JSDOM(`<div>${processedContent}</div>`).window.document.querySelector('div');
	const firstParagraph = tempDiv?.querySelector('p')?.textContent || '';
	const excerpt = firstParagraph.substring(0, 200).trim() + (firstParagraph.length > 200 ? '...' : '');
	
	const blogPost = {
		id: Date.now().toString(36) + Math.random().toString(36).substr(2),
		slug,
		title: post.title,
		content: processedContent,
		excerpt,
		author: {
			id: 'legacy-import',
			name: 'Alex Hopmann',
			email: 'alex@alexhopmann.com'
		},
		categories: post.category ? [post.category] : ['Technology'],
		tags: [],
		status: 'published' as const,
		publishedAt: post.date,
		createdAt: post.date,
		updatedAt: new Date(),
		views: 0
	};
	
	return blogPost;
}

// Main migration function
async function migrate() {
	console.log('Starting content migration...');
	
	// Ensure container exists
	await containerClient.createIfNotExists();
	
	// Get database and container
	const database = cosmosClient.database(config.cosmos.databaseId);
	const container = database.container(config.cosmos.containerId);
	
	// Find all HTML files
	const htmlFiles = readdirSync(config.sourcePath)
		.filter(file => file.endsWith('.htm') || file.endsWith('.html'))
		.filter(file => file.includes('article') || file.includes('post'));
	
	console.log(`Found ${htmlFiles.length} HTML files to migrate`);
	
	let successCount = 0;
	let errorCount = 0;
	
	for (const file of htmlFiles) {
		const filePath = join(config.sourcePath, file);
		console.log(`Processing ${file}...`);
		
		const legacyPost = parseLegacyPost(filePath);
		if (!legacyPost) {
			errorCount++;
			continue;
		}
		
		try {
			const blogPost = await migratePost(legacyPost);
			
			// Check if post already exists
			const { resources } = await container.items
				.query({
					query: 'SELECT * FROM c WHERE c.slug = @slug',
					parameters: [{ name: '@slug', value: blogPost.slug }]
				})
				.fetchAll();
			
			if (resources.length > 0) {
				console.log(`Post with slug "${blogPost.slug}" already exists, skipping...`);
				continue;
			}
			
			// Create post in Cosmos DB
			await container.items.create(blogPost);
			console.log(`✓ Migrated: ${blogPost.title}`);
			successCount++;
		} catch (error) {
			console.error(`✗ Error migrating ${file}:`, error);
			errorCount++;
		}
	}
	
	console.log('\nMigration complete!');
	console.log(`Success: ${successCount} posts`);
	console.log(`Errors: ${errorCount} posts`);
}

// Run migration
migrate().catch(console.error);
#!/usr/bin/env node
import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, basename, dirname } from 'path';
import { CosmosClient } from '@azure/cosmos';
import { BlobServiceClient } from '@azure/storage-blob';
import { marked } from 'marked';
import { JSDOM } from 'jsdom';
import DOMPurify from 'dompurify';
import { fileURLToPath } from 'url';
import { config as dotenvConfig } from 'dotenv';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenvConfig({ path: join(__dirname, '..', '.env') });

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
	sourcePath: join(__dirname, '../../old_alexhopmann.com/docroot')
};

// Validate configuration
if (!config.cosmos.endpoint || !config.cosmos.key) {
	console.error('Error: Cosmos DB configuration is missing. Please check your .env file.');
	console.error('COSMOS_ENDPOINT:', config.cosmos.endpoint ? 'Set' : 'Missing');
	console.error('COSMOS_KEY:', config.cosmos.key ? 'Set' : 'Missing');
	process.exit(1);
}

if (!existsSync(config.sourcePath)) {
	console.error(`Error: Source path does not exist: ${config.sourcePath}`);
	console.error('Please ensure the old_alexhopmann.com directory is in the parent directory.');
	process.exit(1);
}

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
		
		// Try to extract from custom XML-like format first
		const headerMatch = content.match(/<header>(.*?)<\/header>/s);
		const contentMatch = content.match(/<content>(.*?)<\/content>/s);
		const topicMatch = content.match(/<topic\s+name="([^"]+)"(?:\s+sub="([^"]+)")?\s*\/>/);
		
		let title: string;
		let postContent: string;
		let category: string | undefined;
		
		if (headerMatch && contentMatch) {
			// Use the custom format
			title = headerMatch[1].trim();
			postContent = contentMatch[1].trim();
			category = topicMatch ? topicMatch[1] : undefined;
		} else {
			// Fall back to DOM parsing
			const dom = new JSDOM(content);
			const document = dom.window.document;
			
			// Try to find title in header-pagesub class first
			let titleElement = document.querySelector('p.header-pagesub');
			if (!titleElement) {
				// Try other selectors
				titleElement = document.querySelector('h1.DateHeader + p.header-pagesub, h2, .header');
			}
			
			title = titleElement?.textContent?.trim() || '';
			
			// If still no title or it's just the generic site name, use the filename
			if (!title || title === 'Alex Hopmann\'s Web Site') {
				title = basename(filePath, '.htm').replace(/article\s+/, '').replace(/-/g, ' ');
			}
			
			// Extract content - look for the main content area
			const centerColumn = document.querySelector('td.centercolumn');
			if (centerColumn) {
				// Remove navigation and header elements
				const dateHeader = centerColumn.querySelector('h1.DateHeader');
				const pageSub = centerColumn.querySelector('p.header-pagesub');
				if (dateHeader) dateHeader.remove();
				if (pageSub) pageSub.remove();
				postContent = centerColumn.innerHTML || '';
			} else {
				const bodyElement = document.querySelector('body');
				postContent = bodyElement?.innerHTML || content;
			}
		}
		
		// Extract date from filename (article YYYY-MM-DD.htm)
		const dateMatch = basename(filePath).match(/(\d{4})-(\d{2})-(\d{2})/);
		const date = dateMatch 
			? new Date(parseInt(dateMatch[1]), parseInt(dateMatch[2]) - 1, parseInt(dateMatch[3]))
			: new Date(statSync(filePath).mtime);
		
		// Find images using DOM parser
		const dom = new JSDOM(content);
		const images: string[] = [];
		dom.window.document.querySelectorAll('img').forEach(img => {
			const src = img.getAttribute('src');
			if (src && !src.startsWith('http://') && !src.startsWith('https://')) {
				images.push(src);
			}
		});
		
		return {
			title,
			content: postContent,
			date,
			category,
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
		// Skip external URLs
		if (originalUrl.startsWith('http://') || originalUrl.startsWith('https://')) {
			return originalUrl;
		}
		
		const fullPath = join(localPath, originalUrl);
		
		// Check if file exists
		if (!existsSync(fullPath)) {
			console.warn(`Image not found: ${fullPath}`);
			return originalUrl;
		}
		
		const imageData = readFileSync(fullPath);
		const blobName = `migrated/${Date.now()}-${basename(originalUrl)}`;
		
		const blockBlobClient = containerClient.getBlockBlobClient(blobName);
		await blockBlobClient.upload(imageData, imageData.length, {
			blobHTTPHeaders: {
				blobContentType: getContentType(originalUrl)
			}
		});
		
		return blockBlobClient.url;
	} catch (error) {
		console.error(`Error uploading image ${originalUrl}:`, error);
		return originalUrl; // Return original URL as fallback
	}
}

// Get content type from file extension
function getContentType(filename: string): string {
	const ext = filename.toLowerCase().split('.').pop();
	const types: { [key: string]: string } = {
		'jpg': 'image/jpeg',
		'jpeg': 'image/jpeg',
		'png': 'image/png',
		'gif': 'image/gif',
		'webp': 'image/webp',
		'svg': 'image/svg+xml'
	};
	return types[ext || ''] || 'application/octet-stream';
}

// Process content and update image URLs
async function processContent(content: string, images: string[], sourcePath: string): Promise<string> {
	let processedContent = content;
	
	// Upload images and replace URLs
	for (const imageUrl of images) {
		try {
			const newUrl = await uploadImage(sourcePath, imageUrl);
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
		ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'i', 'b', 'a', 'img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'table', 'tr', 'td', 'th', 'tbody', 'thead'],
		ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'target', 'rel', 'class', 'style']
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
async function migratePost(post: LegacyPost, filePath: string) {
	const sourceDir = dirname(filePath);
	const processedContent = await processContent(post.content, post.images, sourceDir);
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
			const blogPost = await migratePost(legacyPost, filePath);
			
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
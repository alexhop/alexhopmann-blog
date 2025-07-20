#!/usr/bin/env node
import { CosmosClient } from '@azure/cosmos';
import { config as dotenvConfig } from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

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
	}
};

async function clearPosts() {
	console.log('Clearing all posts...');
	
	const cosmosClient = new CosmosClient({
		endpoint: config.cosmos.endpoint,
		key: config.cosmos.key
	});
	
	const database = cosmosClient.database(config.cosmos.databaseId);
	const container = database.container(config.cosmos.containerId);
	
	// Get all posts
	const { resources } = await container.items.readAll().fetchAll();
	
	console.log(`Found ${resources.length} posts to delete`);
	
	// Delete each post
	for (const post of resources) {
		try {
			await container.item(post.id, post.id).delete();
			console.log(`Deleted: ${post.title}`);
		} catch (error) {
			console.error(`Error deleting post ${post.id}:`, error);
		}
	}
	
	console.log('All posts cleared!');
}

clearPosts().catch(console.error);
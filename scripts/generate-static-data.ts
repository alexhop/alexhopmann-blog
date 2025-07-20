#!/usr/bin/env node
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { CosmosClient } from '@azure/cosmos';
import { config as dotenvConfig } from 'dotenv';
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

async function generateStaticData() {
	console.log('Generating static data...');
	
	// Skip if no Cosmos DB config
	if (!config.cosmos.endpoint || !config.cosmos.key) {
		console.log('No Cosmos DB config, creating empty data file');
		const outputDir = join(__dirname, '..', 'static', 'data');
		mkdirSync(outputDir, { recursive: true });
		writeFileSync(join(outputDir, 'posts.json'), JSON.stringify({ posts: [] }));
		return;
	}
	
	try {
		const cosmosClient = new CosmosClient({
			endpoint: config.cosmos.endpoint,
			key: config.cosmos.key
		});
		
		const database = cosmosClient.database(config.cosmos.databaseId);
		const container = database.container(config.cosmos.containerId);
		
		// Get all published posts
		const querySpec = {
			query: "SELECT * FROM c WHERE c.status = @status ORDER BY c.publishedAt DESC",
			parameters: [
				{ name: "@status", value: "published" }
			]
		};
		
		const { resources } = await container.items.query(querySpec).fetchAll();
		
		// Create output directory
		const outputDir = join(__dirname, '..', 'static', 'data');
		mkdirSync(outputDir, { recursive: true });
		
		// Write posts data
		writeFileSync(
			join(outputDir, 'posts.json'),
			JSON.stringify({ posts: resources }, null, 2)
		);
		
		console.log(`Generated static data for ${resources.length} posts`);
	} catch (error) {
		console.error('Error generating static data:', error);
		// Create empty file on error
		const outputDir = join(__dirname, '..', 'static', 'data');
		mkdirSync(outputDir, { recursive: true });
		writeFileSync(join(outputDir, 'posts.json'), JSON.stringify({ posts: [] }));
	}
}

generateStaticData().catch(console.error);
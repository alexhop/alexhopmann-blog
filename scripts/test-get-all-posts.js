#!/usr/bin/env node

// Test the getAllPosts function
import { config } from 'dotenv';
config();

// Mock the config module
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Set up module aliases
import { CosmosClient } from '@azure/cosmos';

async function testGetAllPosts() {
    console.log('Testing getAllPosts function...\n');
    
    const endpoint = process.env.COSMOS_ENDPOINT;
    const key = process.env.COSMOS_KEY;
    const databaseId = process.env.COSMOS_DATABASE || 'alexhopmann-blog';
    const containerId = process.env.COSMOS_CONTAINER_POSTS || 'posts';
    
    try {
        const client = new CosmosClient({ endpoint, key });
        const database = client.database(databaseId);
        const container = database.container(containerId);
        
        // Test 1: Simple query (what getAllPosts does)
        console.log('Test 1: getAllPosts query simulation');
        try {
            const query = {
                query: 'SELECT * FROM c ORDER BY c.publishedAt DESC'
            };
            const { resources: posts1 } = await container.items.query(query).fetchAll();
            console.log(`✓ Query successful: ${posts1.length} posts found`);
        } catch (error) {
            console.error(`✗ Query failed: ${error.message}`);
            console.error('  This is likely the issue in getAllPosts');
        }
        
        // Test 2: Query without ORDER BY
        console.log('\nTest 2: Query without ORDER BY');
        try {
            const { resources: posts2 } = await container.items
                .query('SELECT * FROM c')
                .fetchAll();
            console.log(`✓ Simple query successful: ${posts2.length} posts found`);
        } catch (error) {
            console.error(`✗ Simple query failed: ${error.message}`);
        }
        
        // Test 3: Check container configuration
        console.log('\nTest 3: Container configuration');
        const { resource: containerInfo } = await container.read();
        console.log(`Container ID: ${containerInfo.id}`);
        console.log(`Partition key: ${containerInfo.partitionKey?.paths?.[0]}`);
        console.log(`Indexing policy:`, JSON.stringify(containerInfo.indexingPolicy, null, 2));
        
    } catch (error) {
        console.error('\nError:', error.message);
    }
}

testGetAllPosts();
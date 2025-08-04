#!/usr/bin/env node

// Test script to verify post deletion functionality
import { config } from 'dotenv';
import { CosmosClient } from '@azure/cosmos';

config();

async function testDeletePost() {
    console.log('Testing Cosmos DB post deletion...\n');
    
    // Check environment variables
    const endpoint = process.env.COSMOS_ENDPOINT;
    const key = process.env.COSMOS_KEY;
    const databaseId = process.env.COSMOS_DATABASE || 'alexhopmann-blog';
    const containerId = process.env.COSMOS_CONTAINER_POSTS || 'posts';
    
    if (!endpoint || !key) {
        console.error('Error: Missing COSMOS_ENDPOINT or COSMOS_KEY environment variables');
        process.exit(1);
    }
    
    console.log('Cosmos DB Configuration:');
    console.log(`- Endpoint: ${endpoint}`);
    console.log(`- Database: ${databaseId}`);
    console.log(`- Container: ${containerId}\n`);
    
    try {
        // Initialize Cosmos client
        const client = new CosmosClient({ endpoint, key });
        const database = client.database(databaseId);
        const container = database.container(containerId);
        
        // Get all posts
        console.log('Fetching all posts...');
        const { resources: posts } = await container.items
            .query('SELECT c.id, c.slug, c.title, c.status FROM c ORDER BY c.publishedAt DESC')
            .fetchAll();
        
        console.log(`Found ${posts.length} posts:\n`);
        posts.slice(0, 5).forEach((post, index) => {
            console.log(`${index + 1}. ${post.title}`);
            console.log(`   ID: ${post.id}`);
            console.log(`   Slug: ${post.slug}`);
            console.log(`   Status: ${post.status}\n`);
        });
        
        // Test reading a specific post
        if (posts.length > 0) {
            const testPost = posts[0];
            console.log(`\nTesting read operation for post: "${testPost.title}"`);
            
            try {
                const { resource: readPost } = await container
                    .item(testPost.id, testPost.slug)
                    .read();
                
                if (readPost) {
                    console.log('✓ Successfully read post');
                    console.log(`  - Partition key (slug): ${readPost.slug}`);
                    console.log(`  - Document ID: ${readPost.id}`);
                } else {
                    console.log('✗ Post not found');
                }
            } catch (error) {
                console.error('✗ Error reading post:', error.message);
                if (error.code === 404) {
                    console.log('  Note: 404 error suggests partition key mismatch');
                }
            }
        }
        
        // Test delete operation (dry run)
        console.log('\n--- Delete Operation Test (Dry Run) ---');
        console.log('The actual delete endpoint would:');
        console.log('1. Verify user authentication and authorization');
        console.log('2. Get post by slug to find the ID');
        console.log('3. Call container.item(id, slug).delete()');
        console.log('\nKey requirements for successful deletion:');
        console.log('- Both ID and slug (partition key) must match exactly');
        console.log('- User must be authenticated and authorized');
        console.log('- Cosmos DB credentials must be valid');
        
    } catch (error) {
        console.error('\nError:', error.message);
        if (error.code === 401) {
            console.error('Authentication failed - check your Cosmos DB key');
        } else if (error.code === 404) {
            console.error('Database or container not found');
        }
    }
}

testDeletePost();
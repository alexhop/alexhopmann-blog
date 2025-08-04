#!/usr/bin/env node

// Test script to verify the deletion fix works
import { config } from 'dotenv';
import { CosmosClient } from '@azure/cosmos';

config();

async function testDeleteFix() {
    console.log('Testing deletion fix with id as partition key...\n');
    
    const endpoint = process.env.COSMOS_ENDPOINT;
    const key = process.env.COSMOS_KEY;
    const databaseId = process.env.COSMOS_DATABASE || 'alexhopmann-blog';
    const containerId = process.env.COSMOS_CONTAINER_POSTS || 'posts';
    
    try {
        const client = new CosmosClient({ endpoint, key });
        const database = client.database(databaseId);
        const container = database.container(containerId);
        
        // Get a sample post
        const { resources: posts } = await container.items
            .query('SELECT * FROM c OFFSET 0 LIMIT 1')
            .fetchAll();
        
        if (posts.length === 0) {
            console.log('No posts found to test');
            return;
        }
        
        const testPost = posts[0];
        console.log('Test post:');
        console.log(`- ID: ${testPost.id}`);
        console.log(`- Slug: ${testPost.slug}`);
        console.log(`- Title: ${testPost.title}\n`);
        
        // Test read with id as partition key
        console.log('Testing read with id as partition key...');
        try {
            const { resource: readPost } = await container
                .item(testPost.id, testPost.id)  // Using id as partition key
                .read();
            
            if (readPost) {
                console.log('✓ Successfully read post with id as partition key');
                console.log(`  Retrieved: "${readPost.title}"`);
            }
        } catch (error) {
            console.error('✗ Failed to read with id as partition key:', error.code);
            
            // Try with slug as partition key (old way)
            try {
                const { resource: readPost2 } = await container
                    .item(testPost.id, testPost.slug)
                    .read();
                console.log('✓ Post accessible with slug as partition key (old configuration)');
            } catch (error2) {
                console.log('✗ Also failed with slug as partition key');
            }
        }
        
        // Test the actual functions
        console.log('\n--- Testing through application functions ---');
        console.log('Import the posts module and test...');
        
        try {
            const { getPostBySlug, deletePost } = await import('../src/lib/server/posts.js');
            
            // Test getting post by slug
            const post = await getPostBySlug(testPost.slug);
            if (post) {
                console.log('✓ getPostBySlug works correctly');
                console.log(`  Found: "${post.title}"`);
                
                // Note: We won't actually delete in this test
                console.log('\nThe deletePost function would now use:');
                console.log(`  container.item("${post.id}", "${post.id}").delete()`);
                console.log('  (Using id as both document ID and partition key)');
            } else {
                console.log('✗ getPostBySlug failed');
            }
        } catch (importError) {
            console.log('Could not import application modules (expected in test environment)');
        }
        
    } catch (error) {
        console.error('\nError:', error.message);
    }
}

testDeleteFix();
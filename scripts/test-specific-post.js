#!/usr/bin/env node

// Test script to investigate the specific problematic post
import { config } from 'dotenv';
import { CosmosClient } from '@azure/cosmos';

config();

async function testSpecificPost() {
    console.log('Testing specific post: "starting-blogging-again"...\n');
    
    const endpoint = process.env.COSMOS_ENDPOINT;
    const key = process.env.COSMOS_KEY;
    const databaseId = process.env.COSMOS_DATABASE || 'alexhopmann-blog';
    const containerId = process.env.COSMOS_CONTAINER_POSTS || 'posts';
    
    if (!endpoint || !key) {
        console.error('Error: Missing COSMOS_ENDPOINT or COSMOS_KEY environment variables');
        process.exit(1);
    }
    
    try {
        const client = new CosmosClient({ endpoint, key });
        const database = client.database(databaseId);
        const container = database.container(containerId);
        
        // Get partition key info
        const { resource: containerInfo } = await container.read();
        console.log('Container partition key:', containerInfo.partitionKey?.paths?.[0] || 'Unknown');
        console.log('');
        
        // Query for the specific post by slug
        console.log('Searching for post with slug "starting-blogging-again"...');
        const query = {
            query: 'SELECT * FROM c WHERE c.slug = @slug',
            parameters: [{ name: '@slug', value: 'starting-blogging-again' }]
        };
        
        const { resources: posts } = await container.items.query(query).fetchAll();
        console.log(`Found ${posts.length} post(s) with this slug\n`);
        
        if (posts.length === 0) {
            console.log('No post found with slug "starting-blogging-again"');
            return;
        }
        
        for (const post of posts) {
            console.log('Post details:');
            console.log(`  ID: ${post.id}`);
            console.log(`  Title: ${post.title}`);
            console.log(`  Slug: ${post.slug}`);
            console.log(`  Status: ${post.status}`);
            console.log(`  Author ID: ${post.author?.id}`);
            console.log(`  Published At: ${post.publishedAt}`);
            console.log(`  Has _rid: ${!!post._rid}`);
            console.log(`  Has _etag: ${!!post._etag}`);
            console.log('');
            
            // Test reading with different partition key approaches
            console.log('Testing read operations:');
            
            // Test 1: Using id as partition key (current approach)
            try {
                const { resource: readPost } = await container.item(post.id, post.id).read();
                if (readPost) {
                    console.log(`✓ Successfully read using id as partition key`);
                }
            } catch (error) {
                console.log(`✗ Failed with id as partition key: ${error.code || error.message}`);
            }
            
            // Test 2: Using slug as partition key (old approach)
            try {
                const { resource: readPost } = await container.item(post.id, post.slug).read();
                if (readPost) {
                    console.log(`✓ Successfully read using slug as partition key`);
                }
            } catch (error) {
                console.log(`✗ Failed with slug as partition key: ${error.code || error.message}`);
            }
            
            // Test delete operation (dry run)
            console.log('\nTest delete operation (dry run):');
            try {
                // First verify we can read it
                const { resource: toDelete } = await container.item(post.id, post.id).read();
                if (toDelete) {
                    console.log('✓ Post exists and can be read for deletion');
                    console.log('  Would execute: container.item(id, id).delete()');
                    console.log(`  With values: container.item("${post.id}", "${post.id}").delete()`);
                }
            } catch (error) {
                console.log(`✗ Cannot read post for deletion: ${error.code || error.message}`);
            }
        }
        
    } catch (error) {
        console.error('\nError:', error.message);
    }
}

testSpecificPost();
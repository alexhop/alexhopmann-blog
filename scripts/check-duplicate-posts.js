#!/usr/bin/env node

// Script to check for duplicate posts and test deletion
import { config } from 'dotenv';
import { CosmosClient } from '@azure/cosmos';

config();

async function checkDuplicatePosts() {
    console.log('Checking for duplicate posts in Cosmos DB...\n');
    
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
        
        // Get all posts
        const { resources: posts } = await container.items
            .query('SELECT * FROM c')
            .fetchAll();
        
        console.log(`Total posts: ${posts.length}\n`);
        
        // Find duplicates by slug
        const slugCounts = {};
        const duplicateSlugs = [];
        
        posts.forEach(post => {
            if (!slugCounts[post.slug]) {
                slugCounts[post.slug] = [];
            }
            slugCounts[post.slug].push(post);
        });
        
        for (const [slug, postList] of Object.entries(slugCounts)) {
            if (postList.length > 1) {
                duplicateSlugs.push({ slug, posts: postList });
            }
        }
        
        if (duplicateSlugs.length > 0) {
            console.log(`Found ${duplicateSlugs.length} slugs with duplicates:\n`);
            
            duplicateSlugs.forEach(({ slug, posts }) => {
                console.log(`Slug: "${slug}" (${posts.length} duplicates)`);
                posts.forEach((post, index) => {
                    console.log(`  ${index + 1}. ID: ${post.id}`);
                    console.log(`     Title: ${post.title}`);
                    console.log(`     Status: ${post.status}`);
                    console.log(`     Published: ${post.publishedAt || 'N/A'}`);
                    console.log(`     Has _rid: ${!!post._rid}`);
                });
                console.log('');
            });
            
            // Test accessing a duplicate post
            const testDuplicate = duplicateSlugs[0];
            console.log(`\nTesting access to duplicate post with slug: "${testDuplicate.slug}"`);
            
            for (const post of testDuplicate.posts) {
                console.log(`\nTrying to read post with ID: ${post.id}`);
                try {
                    // Try with just ID (using _rid as partition key value)
                    const { resource: readPost } = await container
                        .item(post.id, post.slug)
                        .read();
                    
                    if (readPost) {
                        console.log('✓ Successfully read post using slug as partition key');
                    }
                } catch (error) {
                    console.log(`✗ Failed with slug: ${error.code || error.message}`);
                    
                    // Try reading without partition key (scan)
                    try {
                        const query = {
                            query: 'SELECT * FROM c WHERE c.id = @id',
                            parameters: [{ name: '@id', value: post.id }]
                        };
                        const { resources } = await container.items.query(query).fetchAll();
                        if (resources.length > 0) {
                            console.log('✓ Post exists but partition key mismatch');
                            console.log(`  Actual document:`, {
                                id: resources[0].id,
                                slug: resources[0].slug,
                                _partitionKey: resources[0]._partitionKey
                            });
                        }
                    } catch (scanError) {
                        console.log('✗ Could not find post even with scan');
                    }
                }
            }
        } else {
            console.log('No duplicate slugs found.');
        }
        
        // Check partition key configuration
        console.log('\n--- Container Configuration ---');
        const { resource: containerInfo } = await container.read();
        console.log('Partition key path:', containerInfo.partitionKey?.paths?.[0] || 'Unknown');
        
    } catch (error) {
        console.error('\nError:', error.message);
    }
}

checkDuplicatePosts();
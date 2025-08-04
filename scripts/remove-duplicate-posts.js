#!/usr/bin/env node

// Script to remove duplicate posts, keeping only the most recent
import { config } from 'dotenv';
import { CosmosClient } from '@azure/cosmos';

config();

async function removeDuplicatePosts() {
    console.log('Removing duplicate posts from Cosmos DB...\n');
    
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
        const slugGroups = {};
        
        posts.forEach(post => {
            if (!slugGroups[post.slug]) {
                slugGroups[post.slug] = [];
            }
            slugGroups[post.slug].push(post);
        });
        
        // Process duplicates
        let duplicatesFound = 0;
        let postsDeleted = 0;
        
        for (const [slug, postList] of Object.entries(slugGroups)) {
            if (postList.length > 1) {
                duplicatesFound++;
                console.log(`\nFound ${postList.length} posts with slug: "${slug}"`);
                
                // Sort by publishedAt date (newest first)
                postList.sort((a, b) => {
                    const dateA = new Date(a.publishedAt || 0);
                    const dateB = new Date(b.publishedAt || 0);
                    return dateB.getTime() - dateA.getTime();
                });
                
                console.log('Posts (sorted by date, newest first):');
                postList.forEach((post, index) => {
                    console.log(`  ${index + 1}. ID: ${post.id}`);
                    console.log(`     Title: ${post.title}`);
                    console.log(`     Published: ${post.publishedAt || 'N/A'}`);
                    console.log(`     Status: ${post.status}`);
                });
                
                // Keep the first (newest) post, delete the rest
                const toKeep = postList[0];
                const toDelete = postList.slice(1);
                
                console.log(`\nKeeping post with ID: ${toKeep.id}`);
                console.log(`Deleting ${toDelete.length} duplicate(s)...`);
                
                for (const post of toDelete) {
                    try {
                        // Delete using id as partition key
                        await container.item(post.id, post.id).delete();
                        console.log(`  ✓ Deleted post ${post.id}`);
                        postsDeleted++;
                    } catch (error) {
                        console.error(`  ✗ Failed to delete post ${post.id}: ${error.message}`);
                    }
                }
            }
        }
        
        if (duplicatesFound === 0) {
            console.log('No duplicate posts found.');
        } else {
            console.log(`\n--- Summary ---`);
            console.log(`Duplicate slugs found: ${duplicatesFound}`);
            console.log(`Posts deleted: ${postsDeleted}`);
            console.log(`Remaining posts: ${posts.length - postsDeleted}`);
        }
        
    } catch (error) {
        console.error('\nError:', error.message);
    }
}

// Confirm before running
console.log('This script will DELETE duplicate posts from your Cosmos DB.');
console.log('It will keep only the most recently published version of each post.\n');

const readline = await import('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('Are you sure you want to continue? (yes/no): ', (answer) => {
    rl.close();
    if (answer.toLowerCase() === 'yes') {
        removeDuplicatePosts();
    } else {
        console.log('Operation cancelled.');
    }
});
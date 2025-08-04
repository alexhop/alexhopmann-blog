#!/usr/bin/env node

// Check the structure of posts in the database
import { config } from 'dotenv';
import { CosmosClient } from '@azure/cosmos';

config();

async function checkPostStructure() {
    console.log('Checking post structure in Cosmos DB...\n');
    
    const endpoint = process.env.COSMOS_ENDPOINT;
    const key = process.env.COSMOS_KEY;
    const databaseId = process.env.COSMOS_DATABASE || 'alexhopmann-blog';
    const containerId = process.env.COSMOS_CONTAINER_POSTS || 'posts';
    
    try {
        const client = new CosmosClient({ endpoint, key });
        const database = client.database(databaseId);
        const container = database.container(containerId);
        
        // Get a few sample posts
        const { resources: posts } = await container.items
            .query('SELECT * FROM c OFFSET 0 LIMIT 5')
            .fetchAll();
        
        console.log(`Checking ${posts.length} sample posts:\n`);
        
        posts.forEach((post, index) => {
            console.log(`Post ${index + 1}:`);
            console.log(`- ID: ${post.id}`);
            console.log(`- Title: ${post.title}`);
            console.log(`- Slug: ${post.slug}`);
            console.log(`- Status: ${post.status}`);
            console.log(`- Has author: ${!!post.author}`);
            if (post.author) {
                console.log(`  - Author type: ${typeof post.author}`);
                console.log(`  - Author structure:`, JSON.stringify(post.author, null, 2));
            }
            console.log(`- Has publishedAt: ${!!post.publishedAt}`);
            console.log(`- Has createdAt: ${!!post.createdAt}`);
            console.log(`- Views: ${post.views || 0}`);
            console.log('');
        });
        
        // Check for posts without author
        const { resources: postsWithoutAuthor } = await container.items
            .query({
                query: 'SELECT c.id, c.title FROM c WHERE NOT IS_DEFINED(c.author) OR c.author = null'
            })
            .fetchAll();
        
        if (postsWithoutAuthor.length > 0) {
            console.log(`\n⚠️  Found ${postsWithoutAuthor.length} posts without author field:`);
            postsWithoutAuthor.slice(0, 10).forEach(post => {
                console.log(`- ${post.title} (ID: ${post.id})`);
            });
            
            console.log('\nThis is likely causing the issue in the admin panel!');
            console.log('The admin panel expects post.author.name to exist.');
        } else {
            console.log('\n✓ All posts have author field');
        }
        
    } catch (error) {
        console.error('\nError:', error.message);
    }
}

checkPostStructure();
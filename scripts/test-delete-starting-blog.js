#!/usr/bin/env node

// Test deleting the specific problematic post
import { config } from 'dotenv';
import { CosmosClient } from '@azure/cosmos';

config();

async function testDeleteStartingBlog() {
    console.log('Testing deletion of "starting-blogging-again" post...\n');
    
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
        
        // Find the post
        const query = {
            query: 'SELECT * FROM c WHERE c.slug = @slug',
            parameters: [{ name: '@slug', value: 'starting-blogging-again' }]
        };
        
        const { resources: posts } = await container.items.query(query).fetchAll();
        
        if (posts.length === 0) {
            console.log('Post not found');
            return;
        }
        
        const post = posts[0];
        console.log('Found post:');
        console.log(`  ID: ${post.id}`);
        console.log(`  Title: ${post.title}`);
        console.log(`  Slug: ${post.slug}`);
        console.log('');
        
        // Try to delete it
        console.log('Attempting to delete post...');
        try {
            await container.item(post.id, post.id).delete();
            console.log('✓ Post deleted successfully!');
            
            // Verify deletion
            const { resources: checkPosts } = await container.items.query(query).fetchAll();
            if (checkPosts.length === 0) {
                console.log('✓ Verified: Post no longer exists in database');
            } else {
                console.log('✗ Warning: Post still exists after deletion!');
            }
        } catch (deleteError) {
            console.error('✗ Delete failed:', deleteError.message);
            console.error('Error details:', {
                code: deleteError.code,
                statusCode: deleteError.statusCode,
                substatus: deleteError.substatus
            });
        }
        
    } catch (error) {
        console.error('\nError:', error.message);
    }
}

// Ask for confirmation
console.log('⚠️  WARNING: This will permanently delete the "starting-blogging-again" post!');
console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');

setTimeout(() => {
    testDeleteStartingBlog();
}, 5000);
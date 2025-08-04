#!/usr/bin/env node

// Script to remove the duplicate "starting-blogging-again" post
import { config } from 'dotenv';
import { CosmosClient } from '@azure/cosmos';

config();

async function removeDuplicate() {
    console.log('Removing duplicate "starting-blogging-again" post...\n');
    
    const endpoint = process.env.COSMOS_ENDPOINT;
    const key = process.env.COSMOS_KEY;
    const databaseId = process.env.COSMOS_DATABASE || 'alexhopmann-blog';
    const containerId = process.env.COSMOS_CONTAINER_POSTS || 'posts';
    
    try {
        const client = new CosmosClient({ endpoint, key });
        const database = client.database(databaseId);
        const container = database.container(containerId);
        
        // Find all posts with this slug
        const query = {
            query: 'SELECT * FROM c WHERE c.slug = @slug',
            parameters: [{ name: '@slug', value: 'starting-blogging-again' }]
        };
        
        const { resources: posts } = await container.items.query(query).fetchAll();
        
        console.log(`Found ${posts.length} posts with slug "starting-blogging-again":\n`);
        
        // Sort by publishedAt date (newest first)
        posts.sort((a, b) => {
            const dateA = new Date(a.publishedAt || 0);
            const dateB = new Date(b.publishedAt || 0);
            return dateB.getTime() - dateA.getTime();
        });
        
        posts.forEach((post, index) => {
            console.log(`${index + 1}. ID: ${post.id}`);
            console.log(`   Title: ${post.title}`);
            console.log(`   Published: ${post.publishedAt || 'N/A'}`);
            console.log(`   Created: ${post.createdAt || 'N/A'}`);
            console.log('');
        });
        
        if (posts.length > 1) {
            // Keep the newest, delete the older one
            const toKeep = posts[0];
            const toDelete = posts[1];
            
            console.log(`Keeping post with ID: ${toKeep.id} (newest)`);
            console.log(`Deleting post with ID: ${toDelete.id} (older)\n`);
            
            try {
                // Delete using id as partition key
                await container.item(toDelete.id, toDelete.id).delete();
                console.log('✓ Successfully deleted duplicate post');
            } catch (error) {
                console.error('✗ Failed to delete post:', error.message);
                console.log('\nTrying alternative deletion methods...');
                
                // Try with different partition key configurations
                const partitionKeys = [toDelete.id, toDelete.slug, toDelete._partitionKey];
                
                for (const pk of partitionKeys) {
                    if (pk) {
                        try {
                            console.log(`Trying with partition key: ${pk}`);
                            await container.item(toDelete.id, pk).delete();
                            console.log('✓ Successfully deleted with partition key:', pk);
                            break;
                        } catch (err) {
                            console.log(`✗ Failed with partition key ${pk}`);
                        }
                    }
                }
            }
        } else if (posts.length === 1) {
            console.log('Only one post found with this slug. No duplicates to remove.');
        } else {
            console.log('No posts found with this slug.');
        }
        
    } catch (error) {
        console.error('\nError:', error.message);
    }
}

removeDuplicate();
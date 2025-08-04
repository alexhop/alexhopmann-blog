#!/usr/bin/env node

// Debug the delete operation for the problematic post
import { config } from 'dotenv';
import { CosmosClient } from '@azure/cosmos';

config();

async function debugDeleteOperation() {
    console.log('Debugging delete operation for "starting-blogging-again"...\n');
    
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
        
        // Step 1: Query for the post (simulating getPostBySlug)
        console.log('Step 1: Querying for post by slug...');
        const query = {
            query: 'SELECT * FROM c WHERE c.slug = @slug ORDER BY c.publishedAt DESC',
            parameters: [{ name: '@slug', value: 'starting-blogging-again' }]
        };
        
        const { resources: posts } = await container.items.query(query).fetchAll();
        
        if (posts.length === 0) {
            console.log('✗ Post not found by slug query');
            return;
        }
        
        const post = posts[0];
        console.log('✓ Post found:');
        console.log(`  ID: ${post.id}`);
        console.log(`  Title: ${post.title}`);
        console.log(`  Author ID: ${post.author?.id}`);
        console.log('');
        
        // Step 2: Try to read the item directly (simulating deletePost's read check)
        console.log('Step 2: Reading item directly using container.item()...');
        try {
            const { resource: existingPost, headers } = await container.item(post.id, post.id).read();
            
            if (!existingPost) {
                console.log('✗ Post not found when reading directly');
                return;
            }
            
            console.log('✓ Successfully read post directly');
            console.log(`  ETag: ${headers.etag || 'none'}`);
            console.log(`  Activity ID: ${headers['x-ms-activity-id'] || 'none'}`);
            console.log('');
            
            // Step 3: Check permissions and metadata
            console.log('Step 3: Checking post metadata...');
            console.log(`  Has _rid: ${!!existingPost._rid}`);
            console.log(`  Has _etag: ${!!existingPost._etag}`);
            console.log(`  Has _ts: ${!!existingPost._ts}`);
            console.log(`  _attachments: ${existingPost._attachments || 'none'}`);
            console.log('');
            
            // Step 4: Test delete operation (with rollback)
            console.log('Step 4: Testing delete operation...');
            console.log('⚠️  This is a TEST - the post will NOT be deleted');
            
            // Simulate the exact delete call from the code
            const deleteSimulation = async () => {
                try {
                    // This is exactly what the deletePost function does
                    const result = await container.item(post.id, post.id).delete();
                    return { success: true, result };
                } catch (error) {
                    return { success: false, error };
                }
            };
            
            // We won't actually run the delete, just show what would happen
            console.log('✓ Delete operation would execute:');
            console.log(`  container.item("${post.id}", "${post.id}").delete()`);
            console.log('');
            
            // Check for any potential issues
            console.log('Step 5: Checking for potential issues...');
            
            // Check if the post has any special characters in ID
            if (!/^[a-zA-Z0-9_-]+$/.test(post.id)) {
                console.log('⚠️  Post ID contains special characters');
            } else {
                console.log('✓ Post ID format is valid');
            }
            
            // Check if there are any permission issues
            if (post.author && post.author.id !== 'mddevtsk6j3qpihompl') {
                console.log(`⚠️  Post author (${post.author.id}) differs from expected`);
            } else {
                console.log('✓ Post author matches expected value');
            }
            
            // Check container settings
            console.log('');
            console.log('Step 6: Container configuration...');
            const { resource: containerInfo } = await container.read();
            console.log(`  Partition key path: ${containerInfo.partitionKey?.paths?.[0]}`);
            console.log(`  Indexing mode: ${containerInfo.indexingPolicy?.indexingMode || 'none'}`);
            console.log(`  Conflict resolution: ${containerInfo.conflictResolutionPolicy?.mode || 'none'}`);
            
        } catch (readError) {
            console.log('✗ Error reading post:', readError.message);
            console.log('Error details:', {
                code: readError.code,
                statusCode: readError.statusCode,
                substatus: readError.substatus,
                activityId: readError.headers?.['x-ms-activity-id']
            });
        }
        
    } catch (error) {
        console.error('\nError:', error.message);
    }
}

debugDeleteOperation();
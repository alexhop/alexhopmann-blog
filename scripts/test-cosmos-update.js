// Test script to check Cosmos DB update operations
import { CosmosClient } from '@azure/cosmos';

async function testUpdate() {
    const endpoint = process.env.COSMOS_ENDPOINT || 'https://alexhopmannblog.documents.azure.com:443/';
    const key = process.env.COSMOS_KEY;
    const databaseId = process.env.COSMOS_DATABASE || 'alexhopmann-blog';
    
    if (!key) {
        console.error('COSMOS_KEY environment variable is required');
        process.exit(1);
    }
    
    try {
        console.log('Connecting to Cosmos DB...');
        const client = new CosmosClient({ endpoint, key });
        const database = client.database(databaseId);
        const container = database.container('posts');
        
        // First, try to read a post
        console.log('\n1. Testing READ operation...');
        const query = {
            query: 'SELECT * FROM c WHERE c.slug = @slug',
            parameters: [{ name: '@slug', value: 'starting-blogging-again' }]
        };
        
        const { resources: posts } = await container.items.query(query).fetchAll();
        console.log(`Found ${posts.length} posts with slug 'starting-blogging-again'`);
        
        if (posts.length > 0) {
            const post = posts[0];
            console.log(`Post ID: ${post.id}`);
            console.log(`Post Title: ${post.title}`);
            
            // Try to read using partition key
            console.log('\n2. Testing READ with partition key...');
            try {
                const { resource: readPost } = await container.item(post.id, post.id).read();
                console.log('✓ Read with partition key successful');
            } catch (error) {
                console.error('✗ Read with partition key failed:', error.message);
            }
            
            // Try to update the post
            console.log('\n3. Testing UPDATE operation...');
            try {
                const updatedPost = {
                    ...post,
                    updatedAt: new Date().toISOString(),
                    testUpdate: true
                };
                
                const { resource: result } = await container.item(post.id, post.id).replace(updatedPost);
                console.log('✓ Update successful!');
                console.log(`Updated at: ${result.updatedAt}`);
            } catch (error) {
                console.error('✗ Update failed:', error.message);
                console.error('Full error:', JSON.stringify(error, null, 2));
            }
        }
        
    } catch (error) {
        console.error('Connection error:', error.message);
        console.error('Full error:', JSON.stringify(error, null, 2));
    }
}

testUpdate();
import { CosmosClient } from '@azure/cosmos';

const endpoint = 'https://alexhopmannblog.documents.azure.com:443/';
const key = process.env.COSMOS_KEY;

if (!key) {
  console.error('Please set COSMOS_KEY environment variable');
  process.exit(1);
}

const client = new CosmosClient({ endpoint, key });
const database = client.database('alexhopmann-blog');
const container = database.container('posts');

async function checkPosts() {
  try {
    const { resources: posts } = await container.items
      .query('SELECT * FROM c ORDER BY c.createdAt DESC')
      .fetchAll();
    
    console.log(`Found ${posts.length} posts in Cosmos DB`);
    
    if (posts.length > 0) {
      console.log('\nFirst 5 posts:');
      posts.slice(0, 5).forEach(post => {
        console.log(`- ${post.title} (${post.status}) - Created: ${new Date(post.createdAt).toLocaleDateString()}`);
      });
    }
  } catch (error) {
    console.error('Error querying Cosmos DB:', error.message);
    if (error.code === 404) {
      console.error('Database or container not found');
    }
  }
}

checkPosts();
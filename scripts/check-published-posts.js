import { CosmosClient } from '@azure/cosmos';

const endpoint = 'https://alexhopmannblog.documents.azure.com:443/';
const key = process.env.COSMOS_KEY;

const client = new CosmosClient({ endpoint, key });
const database = client.database('alexhopmann-blog');
const container = database.container('posts');

async function checkPublishedPosts() {
  try {
    // Check all posts
    const { resources: allPosts } = await container.items
      .query('SELECT * FROM c')
      .fetchAll();
    console.log(`Total posts: ${allPosts.length}`);
    
    // Check published posts
    const { resources: publishedPosts } = await container.items
      .query("SELECT * FROM c WHERE c.status = 'published'")
      .fetchAll();
    console.log(`Published posts: ${publishedPosts.length}`);
    
    // Check posts by status
    const statusCounts = {};
    allPosts.forEach(post => {
      statusCounts[post.status] = (statusCounts[post.status] || 0) + 1;
    });
    
    console.log('\nPosts by status:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`- ${status}: ${count}`);
    });
    
    // Show sample of published posts
    if (publishedPosts.length > 0) {
      console.log('\nSample published posts:');
      publishedPosts.slice(0, 3).forEach(post => {
        console.log(`- "${post.title}" (${post.slug})`);
      });
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkPublishedPosts();
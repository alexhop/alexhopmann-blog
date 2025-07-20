import fetch from 'node-fetch';

const siteUrl = 'https://kind-dune-00cb5791e.2.azurestaticapps.net';

async function createTestPost() {
  try {
    const response = await fetch(`${siteUrl}/api/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Welcome to My New Blog!',
        slug: 'welcome-to-my-new-blog',
        content: '<p>This is my new blog built with SvelteKit and deployed on Azure Static Web Apps. I\'m excited to share my thoughts on technology, software development, and life experiences here.</p><p>The blog features:</p><ul><li>Modern, responsive design</li><li>Rich text editor for content creation</li><li>Comment system</li><li>Social media integration</li><li>Azure cloud infrastructure</li></ul><p>Stay tuned for more posts!</p>',
        excerpt: 'Welcome to my new blog built with SvelteKit and Azure. I\'m excited to share my thoughts on technology and life.',
        categories: ['Technology', 'Announcements'],
        tags: ['welcome', 'azure', 'sveltekit', 'blog'],
        status: 'published',
        publishedAt: new Date().toISOString()
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('Test post created successfully!');
      console.log(`View it at: ${siteUrl}/blog/${data.post.slug}`);
    } else {
      console.error('Failed to create post:', data);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

createTestPost();
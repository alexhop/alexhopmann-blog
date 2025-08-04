import dotenv from 'dotenv';
dotenv.config();

import { getDatabase, getContainer } from '../src/lib/server/cosmos.js';
import mysql from 'mysql2/promise';
import TurndownService from 'turndown';
import { JSDOM } from 'jsdom';
import DOMPurify from 'dompurify';
import fs from 'fs/promises';
import { createReadStream } from 'fs';
import readline from 'readline';

const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced'
});

// Configure turndown to handle common WordPress patterns
turndownService.addRule('wpImage', {
  filter: ['img'],
  replacement: (content, node) => {
    const img = node as HTMLImageElement;
    const alt = img.alt || '';
    const src = img.src || '';
    const title = img.title ? ` "${img.title}"` : '';
    return src ? `![${alt}](${src}${title})` : '';
  }
});

function generateSlug(title: string, date: Date): string {
  const dateStr = date.toISOString().split('T')[0];
  const baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  
  return `${dateStr}-${baseSlug}`.substring(0, 100);
}

function cleanContent(content: string): string {
  // Create a DOM environment for DOMPurify
  const window = new JSDOM('').window;
  const purify = DOMPurify(window);
  
  // Clean the HTML
  const cleanHtml = purify.sanitize(content, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
                   'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'table', 'thead', 'tbody', 'tr', 'td', 'th'],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class']
  });
  
  // Convert to Markdown
  const markdown = turndownService.turndown(cleanHtml);
  
  // Clean up any excessive whitespace
  return markdown
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function extractPostsFromSQL(filePath: string): Promise<any[]> {
  const posts: any[] = [];
  const fileStream = createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let currentInsert = '';
  let collectingInsert = false;

  for await (const line of rl) {
    // Look for INSERT INTO `wp_posts` statements
    if (line.includes('INSERT INTO `wp_posts`')) {
      collectingInsert = true;
      currentInsert = line;
    } else if (collectingInsert) {
      currentInsert += '\n' + line;
      
      // Check if this is the end of the INSERT statement
      if (line.trim().endsWith(';')) {
        // Parse the INSERT statement
        try {
          // Extract values from INSERT statement
          const valuesMatch = currentInsert.match(/VALUES\s*\((.*)\);/s);
          if (valuesMatch) {
            const valuesStr = valuesMatch[1];
            // Split by ),( to get individual records
            const records = valuesStr.split(/\),\s*\(/);
            
            for (const record of records) {
              // Clean up the record
              const cleanRecord = record.replace(/^\(|\)$/g, '');
              
              // Parse the values - this is simplified, you might need more robust parsing
              const values = parseInsertValues(cleanRecord);
              
              if (values && values.length >= 23) {
                const post = {
                  ID: parseInt(values[0]),
                  post_author: parseInt(values[1]),
                  post_date: values[2].replace(/'/g, ''),
                  post_date_gmt: values[3].replace(/'/g, ''),
                  post_content: values[4].replace(/^'|'$/g, '').replace(/\\'/g, "'"),
                  post_title: values[5].replace(/^'|'$/g, '').replace(/\\'/g, "'"),
                  post_category: parseInt(values[6]),
                  post_excerpt: values[7].replace(/^'|'$/g, '').replace(/\\'/g, "'"),
                  post_status: values[8].replace(/'/g, ''),
                  comment_status: values[9].replace(/'/g, ''),
                  ping_status: values[10].replace(/'/g, ''),
                  post_password: values[11].replace(/'/g, ''),
                  post_name: values[12].replace(/'/g, ''),
                  to_ping: values[13].replace(/^'|'$/g, ''),
                  pinged: values[14].replace(/^'|'$/g, ''),
                  post_modified: values[15].replace(/'/g, ''),
                  post_modified_gmt: values[16].replace(/'/g, ''),
                  post_content_filtered: values[17].replace(/^'|'$/g, ''),
                  post_parent: parseInt(values[18]),
                  guid: values[19].replace(/'/g, ''),
                  menu_order: parseInt(values[20]),
                  post_type: values[21].replace(/'/g, ''),
                  post_mime_type: values[22].replace(/'/g, ''),
                  comment_count: parseInt(values[23])
                };
                
                // Only include published posts
                if (post.post_status === 'publish' && post.post_type === 'post') {
                  posts.push(post);
                }
              }
            }
          }
        } catch (error) {
          console.error('Error parsing INSERT statement:', error);
        }
        
        collectingInsert = false;
        currentInsert = '';
      }
    }
  }

  return posts;
}

function parseInsertValues(valuesStr: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  let escapeNext = false;
  
  for (let i = 0; i < valuesStr.length; i++) {
    const char = valuesStr[i];
    
    if (escapeNext) {
      current += char;
      escapeNext = false;
      continue;
    }
    
    if (char === '\\') {
      escapeNext = true;
      current += char;
      continue;
    }
    
    if (char === "'" && !escapeNext) {
      inQuotes = !inQuotes;
      current += char;
      continue;
    }
    
    if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
      continue;
    }
    
    current += char;
  }
  
  if (current) {
    values.push(current.trim());
  }
  
  return values;
}

async function checkExistingPost(container: any, slug: string): Promise<boolean> {
  try {
    const query = `SELECT c.id FROM c WHERE c.slug = @slug`;
    const { resources } = await container.items.query({
      query,
      parameters: [{ name: '@slug', value: slug }]
    }).fetchAll();
    
    return resources.length > 0;
  } catch (error) {
    console.error('Error checking existing post:', error);
    return false;
  }
}

async function migratePost(container: any, post: any, authorName: string) {
  try {
    const postDate = new Date(post.post_date);
    if (isNaN(postDate.getTime())) {
      console.log(`Skipping post with invalid date: ${post.post_title}`);
      return;
    }

    const slug = post.post_name || generateSlug(post.post_title, postDate);
    
    // Check if post already exists
    const exists = await checkExistingPost(container, slug);
    if (exists) {
      console.log(`Post already exists, skipping: ${post.post_title}`);
      return;
    }

    // Convert content to markdown
    const content = cleanContent(post.post_content);
    
    // Create the new post document
    const newPost = {
      id: `post-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      slug: slug,
      title: post.post_title,
      content: content,
      excerpt: post.post_excerpt || content.substring(0, 200) + '...',
      author: {
        id: 'alex-hopmann',
        name: authorName,
        email: 'alex@alexhopmann.com'
      },
      status: 'published',
      featuredImage: null,
      categories: ['Uncategorized'], // You might want to map categories properly
      tags: [],
      publishedAt: postDate.toISOString(),
      createdAt: postDate.toISOString(),
      updatedAt: post.post_modified ? new Date(post.post_modified).toISOString() : postDate.toISOString(),
      views: 0,
      type: 'post'
    };

    await container.items.create(newPost);
    console.log(`✓ Migrated: ${post.post_title}`);
  } catch (error) {
    console.error(`✗ Failed to migrate post "${post.post_title}":`, error);
  }
}

async function main() {
  try {
    console.log('Starting migration from SQL file...');
    console.log('COSMOS_ENDPOINT:', process.env.COSMOS_ENDPOINT ? 'Set' : 'Not set');
    
    // Connect to Cosmos DB
    const container = await getContainer('posts');
    
    // Extract posts from SQL file
    console.log('Extracting posts from SQL file...');
    const posts = await extractPostsFromSQL('/Users/alexhop/alexhopmann.com/alexhopmann-blog/alexhopmann-posts.sql');
    
    console.log(`Found ${posts.length} posts to migrate`);
    
    // Migrate each post
    for (const post of posts) {
      await migratePost(container, post, 'Alex Hopmann');
    }
    
    console.log('Migration complete!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
main();
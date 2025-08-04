import fs from 'fs';
import readline from 'readline';
import path from 'path';

async function extractAlexHopmannPosts() {
  const sqlFile = '/Users/alexhop/alexhopmann.com/old_alexhopmann.com/all.sql';
  const outputFile = '/Users/alexhop/alexhopmann.com/alexhopmann-blog/alexhopmann-posts.sql';
  
  const fileStream = fs.createReadStream(sqlFile);
  const writeStream = fs.createWriteStream(outputFile);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let inAlexHopmannDB = false;
  let inPostsTable = false;
  let collectingStatement = false;
  let currentStatement = '';
  let collectingCreateTable = false;
  let insertCount = 0;

  console.log('Starting extraction...');

  for await (const line of rl) {
    // Check if we're entering alexhopmann database
    if (line.includes('USE `alexhopmann`;')) {
      inAlexHopmannDB = true;
      console.log('Found alexhopmann database');
      writeStream.write('-- Extracted posts from alexhopmann database\n');
      writeStream.write('USE `alexhopmann`;\n\n');
      continue;
    }

    // Check if we're leaving alexhopmann database
    if (inAlexHopmannDB && line.includes('USE `') && !line.includes('USE `alexhopmann`;')) {
      inAlexHopmannDB = false;
      console.log('Left alexhopmann database');
      break;
    }

    // Only process when in alexhopmann database
    if (!inAlexHopmannDB) continue;

    // Look for wp_posts table operations
    if (line.includes('CREATE TABLE `wp_posts`')) {
      collectingCreateTable = true;
      writeStream.write('\n-- wp_posts table structure\n');
      writeStream.write(line + '\n');
      continue;
    }

    // Collect CREATE TABLE statement
    if (collectingCreateTable) {
      writeStream.write(line + '\n');
      if (line.includes(';')) {
        collectingCreateTable = false;
        writeStream.write('\n');
      }
      continue;
    }

    // Check for INSERT INTO wp_posts
    if (line.includes('INSERT INTO `wp_posts`')) {
      console.log('Found INSERT INTO wp_posts statement');
      collectingStatement = true;
      currentStatement = line;
      if (line.trim().endsWith(';')) {
        // Single line INSERT
        writeStream.write('\n' + currentStatement + '\n');
        collectingStatement = false;
        currentStatement = '';
        insertCount++;
      }
      continue;
    }

    // Collect multi-line statements
    if (collectingStatement) {
      currentStatement += '\n' + line;
      
      // Check if statement is complete
      if (line.trim().endsWith(';')) {
        writeStream.write('\n' + currentStatement + '\n');
        collectingStatement = false;
        currentStatement = '';
        insertCount++;
        console.log(`Captured INSERT statement #${insertCount}`);
      }
      continue;
    }

    // Also capture LOCK/UNLOCK TABLES and ALTER TABLE statements for wp_posts
    if (line.includes('`wp_posts`') && (line.includes('LOCK TABLES') || line.includes('UNLOCK TABLES') || line.includes('ALTER TABLE'))) {
      writeStream.write(line + '\n');
    }
  }

  writeStream.end();
  console.log(`Extraction complete! Found ${insertCount} INSERT statements`);
  console.log(`Output saved to: ${outputFile}`);
}

extractAlexHopmannPosts().catch(console.error);
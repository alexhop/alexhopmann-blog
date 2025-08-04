#!/usr/bin/env node

// Script to remove unauthorized users from Cosmos DB
import { config } from 'dotenv';
import { CosmosClient } from '@azure/cosmos';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const AUTH_FILE = join(__dirname, '../src/lib/server/authorized-users.ts');

// Read authorized users from the source file
function getAuthorizedEmails() {
    const content = readFileSync(AUTH_FILE, 'utf-8');
    const match = content.match(/export const AUTHORIZED_USERS: AuthorizedUser\[\] = (\[[\s\S]*?\]);/);
    if (!match) {
        throw new Error('Could not parse authorized users file');
    }
    
    const usersArray = new Function('return ' + match[1])();
    return usersArray.map(u => u.email.toLowerCase());
}

async function cleanupUsers() {
    console.log('Cleaning up unauthorized users from Cosmos DB...\n');
    
    const endpoint = process.env.COSMOS_ENDPOINT;
    const key = process.env.COSMOS_KEY;
    const databaseId = process.env.COSMOS_DATABASE || 'alexhopmann-blog';
    const containerId = process.env.COSMOS_CONTAINER_USERS || 'users';
    
    if (!endpoint || !key) {
        console.error('Error: Missing COSMOS_ENDPOINT or COSMOS_KEY environment variables');
        process.exit(1);
    }
    
    try {
        const client = new CosmosClient({ endpoint, key });
        const database = client.database(databaseId);
        const container = database.container(containerId);
        
        // Get authorized emails
        const authorizedEmails = getAuthorizedEmails();
        console.log('Authorized emails:', authorizedEmails);
        console.log('');
        
        // Get all users from database
        const { resources: users } = await container.items
            .query('SELECT * FROM c')
            .fetchAll();
        
        console.log(`Found ${users.length} users in database\n`);
        
        let removedCount = 0;
        
        for (const user of users) {
            const isAuthorized = authorizedEmails.includes(user.email.toLowerCase());
            
            if (!isAuthorized) {
                console.log(`Removing unauthorized user: ${user.email}`);
                try {
                    // Users container uses email as partition key
                    await container.item(user.id, user.email).delete();
                    removedCount++;
                    console.log(`  ✓ Removed`);
                } catch (error) {
                    console.error(`  ✗ Failed to remove: ${error.message}`);
                }
            } else {
                console.log(`✓ Keeping authorized user: ${user.email} (${user.roles.join(', ')})`);
            }
        }
        
        console.log(`\nCleanup complete. Removed ${removedCount} unauthorized users.`);
        
    } catch (error) {
        console.error('\nError:', error.message);
    }
}

// Confirm before running
console.log('This script will REMOVE unauthorized users from your Cosmos DB.');
console.log('Only users listed in authorized-users.ts will be kept.\n');

const readline = await import('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('Are you sure you want to continue? (yes/no): ', (answer) => {
    rl.close();
    if (answer.toLowerCase() === 'yes') {
        cleanupUsers();
    } else {
        console.log('Operation cancelled.');
    }
});
#!/usr/bin/env node

// Check partition keys for all containers
import { config } from 'dotenv';
import { CosmosClient } from '@azure/cosmos';

config();

async function checkPartitionKeys() {
    console.log('Checking partition keys for all containers...\n');
    
    const endpoint = process.env.COSMOS_ENDPOINT;
    const key = process.env.COSMOS_KEY;
    const databaseId = process.env.COSMOS_DATABASE || 'alexhopmann-blog';
    
    if (!endpoint || !key) {
        console.error('Error: Missing COSMOS_ENDPOINT or COSMOS_KEY environment variables');
        process.exit(1);
    }
    
    try {
        const client = new CosmosClient({ endpoint, key });
        const database = client.database(databaseId);
        
        const containers = ['posts', 'comments', 'users'];
        
        for (const containerName of containers) {
            try {
                const container = database.container(containerName);
                const { resource: containerInfo } = await container.read();
                
                console.log(`Container: ${containerName}`);
                console.log(`  Partition key: ${containerInfo.partitionKey?.paths?.[0] || 'Not found'}`);
                
                // Get a sample item to verify
                const { resources: items } = await container.items
                    .query('SELECT * FROM c OFFSET 0 LIMIT 1')
                    .fetchAll();
                
                if (items.length > 0) {
                    const item = items[0];
                    console.log(`  Sample item ID: ${item.id}`);
                    if (containerName === 'posts') {
                        console.log(`  Sample slug: ${item.slug}`);
                    } else if (containerName === 'users') {
                        console.log(`  Sample email: ${item.email}`);
                    }
                }
                console.log('');
            } catch (error) {
                console.log(`Container: ${containerName}`);
                console.log(`  Error: ${error.message}\n`);
            }
        }
        
    } catch (error) {
        console.error('\nError:', error.message);
    }
}

checkPartitionKeys();
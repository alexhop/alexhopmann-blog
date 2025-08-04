import { CosmosClient } from '@azure/cosmos';

const endpoint = 'https://alexhopmannblog.documents.azure.com:443/';
const key = process.env.COSMOS_KEY;

const client = new CosmosClient({ endpoint, key });

async function checkStructure() {
  try {
    // List all databases
    const { resources: databases } = await client.databases.readAll().fetchAll();
    console.log('Databases:');
    for (const db of databases) {
      console.log(`- ${db.id}`);
      
      // List containers in each database
      const database = client.database(db.id);
      const { resources: containers } = await database.containers.readAll().fetchAll();
      console.log(`  Containers:`);
      for (const container of containers) {
        console.log(`  - ${container.id}`);
        
        // Count items in each container
        const cont = database.container(container.id);
        const { resources: items } = await cont.items.query('SELECT VALUE COUNT(1) FROM c').fetchAll();
        console.log(`    Items: ${items[0]}`);
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkStructure();
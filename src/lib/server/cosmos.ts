import { CosmosClient, Database, Container } from '@azure/cosmos';
import { config } from '$lib/config';

let cosmosClient: CosmosClient | null = null;
let database: Database | null = null;
let containers: {
	posts: Container | null;
	comments: Container | null;
	users: Container | null;
} = {
	posts: null,
	comments: null,
	users: null
};

export async function getCosmosClient(): Promise<CosmosClient> {
	if (!cosmosClient) {
		cosmosClient = new CosmosClient({
			endpoint: config.cosmos.endpoint,
			key: config.cosmos.key
		});
	}
	return cosmosClient;
}

export async function getDatabase(): Promise<Database> {
	if (!database) {
		const client = await getCosmosClient();
		const { database: db } = await client.databases.createIfNotExists({
			id: config.cosmos.databaseId
		});
		database = db;
	}
	return database;
}

export async function getContainer(containerName: keyof typeof config.cosmos.containers): Promise<Container> {
	if (!containers[containerName]) {
		const db = await getDatabase();
		const containerId = config.cosmos.containers[containerName];
		
		const partitionKey = containerName === 'posts' ? '/id' : 
						   containerName === 'comments' ? '/postId' : 
						   '/id'; // users container also uses /id
		
		const { container } = await db.containers.createIfNotExists({
			id: containerId,
			partitionKey: { paths: [partitionKey] }
		});
		
		containers[containerName] = container;
	}
	return containers[containerName]!;
}
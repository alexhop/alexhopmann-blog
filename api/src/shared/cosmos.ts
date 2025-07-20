import { CosmosClient, Database, Container } from '@azure/cosmos';
import { config } from './config';

let client: CosmosClient;
let database: Database;
let containers: {
    posts: Container;
    comments: Container;
    users: Container;
};

export function getCosmosClient() {
    if (!client) {
        client = new CosmosClient({
            endpoint: config.cosmos.endpoint,
            key: config.cosmos.key
        });
    }
    return client;
}

export async function getDatabase() {
    if (!database) {
        const client = getCosmosClient();
        database = client.database(config.cosmos.databaseId);
    }
    return database;
}

export async function getContainers() {
    if (!containers) {
        const db = await getDatabase();
        containers = {
            posts: db.container(config.cosmos.containers.posts),
            comments: db.container(config.cosmos.containers.comments),
            users: db.container(config.cosmos.containers.users)
        };
    }
    return containers;
}
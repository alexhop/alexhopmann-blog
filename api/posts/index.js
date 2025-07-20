const { CosmosClient } = require('@azure/cosmos');

const cosmosClient = new CosmosClient({
    endpoint: process.env.COSMOS_ENDPOINT,
    key: process.env.COSMOS_KEY
});

const database = cosmosClient.database(process.env.COSMOS_DATABASE || 'alexhopmann-blog');
const container = database.container(process.env.COSMOS_CONTAINER_POSTS || 'posts');

module.exports = async function (context, req) {
    try {
        if (req.method === 'GET') {
            const querySpec = {
                query: "SELECT * FROM c WHERE c.status = @status ORDER BY c.publishedAt DESC",
                parameters: [
                    { name: "@status", value: "published" }
                ]
            };
            
            const { resources } = await container.items.query(querySpec).fetchAll();
            
            context.res = {
                status: 200,
                headers: { "Content-Type": "application/json" },
                body: { posts: resources }
            };
        } else {
            context.res = {
                status: 405,
                body: "Method not allowed"
            };
        }
    } catch (error) {
        context.log('Error:', error);
        context.res = {
            status: 500,
            body: { error: 'Failed to fetch posts' }
        };
    }
};
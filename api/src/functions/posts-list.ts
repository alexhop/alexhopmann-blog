import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getContainers } from "../shared/cosmos";

export async function postsList(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const { posts } = await getContainers();
        
        const querySpec = {
            query: "SELECT * FROM c WHERE c.status = @status ORDER BY c.publishedAt DESC",
            parameters: [
                { name: "@status", value: "published" }
            ]
        };
        
        const { resources } = await posts.items.query(querySpec).fetchAll();
        
        return {
            status: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ posts: resources })
        };
    } catch (error) {
        context.log('Error fetching posts:', error);
        return {
            status: 500,
            body: JSON.stringify({ error: 'Failed to fetch posts' })
        };
    }
}

app.http('posts-list', {
    methods: ['GET'],
    route: 'posts',
    handler: postsList
});
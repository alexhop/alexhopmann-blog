import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getContainers } from "../shared/cosmos";

export async function postsGet(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const slug = request.params.slug;
        if (!slug) {
            return {
                status: 400,
                body: JSON.stringify({ error: 'Slug parameter is required' })
            };
        }

        const { posts } = await getContainers();
        
        const querySpec = {
            query: "SELECT * FROM c WHERE c.slug = @slug",
            parameters: [
                { name: "@slug", value: slug }
            ]
        };
        
        const { resources } = await posts.items.query(querySpec).fetchAll();
        
        if (resources.length === 0) {
            return {
                status: 404,
                body: JSON.stringify({ error: 'Post not found' })
            };
        }
        
        // Increment view count
        const post = resources[0];
        post.views = (post.views || 0) + 1;
        await posts.item(post.id, post.id).replace(post);
        
        return {
            status: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ post })
        };
    } catch (error) {
        context.log('Error fetching post:', error);
        return {
            status: 500,
            body: JSON.stringify({ error: 'Failed to fetch post' })
        };
    }
}

app.http('posts-get', {
    methods: ['GET'],
    route: 'posts/{slug}',
    handler: postsGet
});
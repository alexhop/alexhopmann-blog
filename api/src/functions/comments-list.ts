import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getContainers } from "../shared/cosmos";

export async function commentsList(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const postId = request.params.postId;
        if (!postId) {
            return {
                status: 400,
                body: JSON.stringify({ error: 'PostId parameter is required' })
            };
        }

        const { comments } = await getContainers();
        
        const querySpec = {
            query: "SELECT * FROM c WHERE c.postId = @postId AND c.status = @status ORDER BY c.createdAt ASC",
            parameters: [
                { name: "@postId", value: postId },
                { name: "@status", value: "approved" }
            ]
        };
        
        const { resources } = await comments.items.query(querySpec).fetchAll();
        
        return {
            status: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ comments: resources })
        };
    } catch (error) {
        context.log('Error fetching comments:', error);
        return {
            status: 500,
            body: JSON.stringify({ error: 'Failed to fetch comments' })
        };
    }
}

app.http('comments-list', {
    methods: ['GET'],
    route: 'posts/{postId}/comments',
    handler: commentsList
});
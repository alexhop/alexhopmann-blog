import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getContainers } from "../shared/cosmos";
import { JSDOM } from 'jsdom';
import DOMPurify from 'dompurify';

export async function commentsCreate(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const postId = request.params.postId;
        if (!postId) {
            return {
                status: 400,
                body: JSON.stringify({ error: 'PostId parameter is required' })
            };
        }

        const body = await request.json() as any;
        
        // Validate required fields
        if (!body.content || !body.author?.name || !body.author?.email) {
            return {
                status: 400,
                body: JSON.stringify({ error: 'Missing required fields' })
            };
        }

        // Sanitize content
        const window = new JSDOM('').window;
        const purify = DOMPurify(window);
        const cleanContent = purify.sanitize(body.content, {
            ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'a'],
            ALLOWED_ATTR: ['href', 'target', 'rel']
        });

        const { comments, posts } = await getContainers();
        
        // Verify post exists
        const postQuery = {
            query: "SELECT * FROM c WHERE c.id = @id",
            parameters: [{ name: "@id", value: postId }]
        };
        const { resources: postResults } = await posts.items.query(postQuery).fetchAll();
        
        if (postResults.length === 0) {
            return {
                status: 404,
                body: JSON.stringify({ error: 'Post not found' })
            };
        }

        const comment = {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2),
            postId: postId,
            content: cleanContent,
            author: {
                name: body.author.name,
                email: body.author.email,
                website: body.author.website || null
            },
            status: 'pending', // Require moderation
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const { resource } = await comments.items.create(comment);
        
        return {
            status: 201,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                comment: resource,
                message: 'Comment submitted for moderation'
            })
        };
    } catch (error) {
        context.log('Error creating comment:', error);
        return {
            status: 500,
            body: JSON.stringify({ error: 'Failed to create comment' })
        };
    }
}

app.http('comments-create', {
    methods: ['POST'],
    route: 'posts/{postId}/comments',
    handler: commentsCreate
});
import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getContainers } from "../shared/cosmos";
import { extractBearerToken, verifyToken } from "../shared/auth";
import { JSDOM } from 'jsdom';
import DOMPurify from 'dompurify';

export async function postsCreate(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        // Verify authentication
        const authHeader = request.headers.get('authorization');
        const token = authHeader ? extractBearerToken(authHeader) : null;
        if (!token) {
            return {
                status: 401,
                body: JSON.stringify({ error: 'Unauthorized' })
            };
        }

        const user = verifyToken(token);
        if (!user || !user.roles.includes('admin')) {
            return {
                status: 403,
                body: JSON.stringify({ error: 'Forbidden' })
            };
        }

        const body = await request.json() as any;
        
        // Validate required fields
        if (!body.title || !body.content || !body.slug) {
            return {
                status: 400,
                body: JSON.stringify({ error: 'Missing required fields' })
            };
        }

        // Sanitize content
        const window = new JSDOM('').window;
        const purify = DOMPurify(window);
        const cleanContent = purify.sanitize(body.content);

        const { posts } = await getContainers();
        
        // Check if slug already exists
        const existingQuery = {
            query: "SELECT * FROM c WHERE c.slug = @slug",
            parameters: [{ name: "@slug", value: body.slug }]
        };
        const { resources: existing } = await posts.items.query(existingQuery).fetchAll();
        
        if (existing.length > 0) {
            return {
                status: 409,
                body: JSON.stringify({ error: 'Slug already exists' })
            };
        }

        const post = {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2),
            slug: body.slug,
            title: body.title,
            content: cleanContent,
            excerpt: body.excerpt || '',
            author: {
                id: user.sub,
                name: user.name,
                email: user.email
            },
            categories: body.categories || [],
            tags: body.tags || [],
            status: body.status || 'draft',
            publishedAt: body.status === 'published' ? new Date() : null,
            createdAt: new Date(),
            updatedAt: new Date(),
            views: 0
        };

        const { resource } = await posts.items.create(post);
        
        return {
            status: 201,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ post: resource })
        };
    } catch (error) {
        context.log('Error creating post:', error);
        return {
            status: 500,
            body: JSON.stringify({ error: 'Failed to create post' })
        };
    }
}

app.http('posts-create', {
    methods: ['POST'],
    route: 'posts',
    handler: postsCreate
});
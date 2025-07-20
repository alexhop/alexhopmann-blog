import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { createToken } from "../shared/auth";
import { getContainers } from "../shared/cosmos";

export async function authCallback(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const body = await request.json() as any;
        
        if (!body.accessToken) {
            return {
                status: 400,
                body: JSON.stringify({ error: 'Access token required' })
            };
        }

        // TODO: Validate the access token with Microsoft Entra ID
        // For now, we'll create a mock user response
        // In production, you would validate the token and get user info from Microsoft Graph API
        
        const mockUser = {
            id: 'mock-user-id',
            email: body.email || 'user@example.com',
            name: body.name || 'Mock User',
            roles: body.email === 'alex@alexhopmann.com' ? ['admin'] : ['user']
        };

        const { users } = await getContainers();
        
        // Check if user exists, create if not
        const querySpec = {
            query: "SELECT * FROM c WHERE c.email = @email",
            parameters: [{ name: "@email", value: mockUser.email }]
        };
        
        const { resources } = await users.items.query(querySpec).fetchAll();
        
        let user;
        if (resources.length === 0) {
            // Create new user
            user = {
                id: mockUser.id,
                email: mockUser.email,
                name: mockUser.name,
                roles: mockUser.roles,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            const { resource } = await users.items.create(user);
            user = resource;
        } else {
            user = resources[0];
        }

        // Create JWT token
        const token = createToken({
            sub: user.id,
            email: user.email,
            name: user.name,
            roles: user.roles
        });

        return {
            status: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    roles: user.roles
                }
            })
        };
    } catch (error) {
        context.log('Error in auth callback:', error);
        return {
            status: 500,
            body: JSON.stringify({ error: 'Authentication failed' })
        };
    }
}

app.http('auth-callback', {
    methods: ['POST'],
    route: 'auth/callback',
    handler: authCallback
});
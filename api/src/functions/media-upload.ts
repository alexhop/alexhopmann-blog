import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { BlobServiceClient } from "@azure/storage-blob";
import { extractBearerToken, verifyToken } from "../shared/auth";
import { config } from "../shared/config";

export async function mediaUpload(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
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

        // Get file from request
        const formData = await request.formData();
        const fileEntry = formData.get('file');
        
        if (!fileEntry || typeof fileEntry === 'string') {
            return {
                status: 400,
                body: JSON.stringify({ error: 'No file provided' })
            };
        }
        
        const file = fileEntry as any; // File from FormData

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];
        if (!allowedTypes.includes(file.type)) {
            return {
                status: 400,
                body: JSON.stringify({ error: 'Invalid file type' })
            };
        }

        // Create blob service client
        const connectionString = `DefaultEndpointsProtocol=https;AccountName=${config.storage.accountName};AccountKey=${config.storage.accountKey};EndpointSuffix=core.windows.net`;
        const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
        const containerClient = blobServiceClient.getContainerClient(config.storage.containerName);

        // Generate unique filename
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 8);
        const extension = file.name.split('.').pop();
        const blobName = `uploads/${timestamp}-${randomString}.${extension}`;

        // Upload file
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        const buffer = await file.arrayBuffer();
        
        await blockBlobClient.upload(buffer, buffer.byteLength, {
            blobHTTPHeaders: {
                blobContentType: file.type
            }
        });

        return {
            status: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                url: blockBlobClient.url,
                filename: blobName,
                size: file.size,
                type: file.type
            })
        };
    } catch (error) {
        context.log('Error uploading media:', error);
        return {
            status: 500,
            body: JSON.stringify({ error: 'Failed to upload media' })
        };
    }
}

app.http('media-upload', {
    methods: ['POST'],
    route: 'media/upload',
    handler: mediaUpload
});
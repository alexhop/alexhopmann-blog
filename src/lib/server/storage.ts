import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';
import { config } from '$lib/config';
import type { MediaFile } from '$lib/types';

let blobServiceClient: BlobServiceClient | null = null;
let containerClient: ContainerClient | null = null;

function getBlobServiceClient(): BlobServiceClient {
	if (!blobServiceClient) {
		const connectionString = `DefaultEndpointsProtocol=https;AccountName=${config.storage.accountName};AccountKey=${config.storage.accountKey};EndpointSuffix=core.windows.net`;
		blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
	}
	return blobServiceClient;
}

async function getContainerClient(): Promise<ContainerClient> {
	if (!containerClient) {
		const blobService = getBlobServiceClient();
		containerClient = blobService.getContainerClient(config.storage.containerName);
		
		// Create container if it doesn't exist
		await containerClient.createIfNotExists({
			access: 'blob' // Public read access for blobs
		});
	}
	return containerClient;
}

export async function uploadFile(
	filename: string,
	buffer: Buffer,
	contentType: string
): Promise<MediaFile> {
	const container = await getContainerClient();
	
	// Generate unique filename
	const timestamp = Date.now();
	const uniqueFilename = `${timestamp}-${filename}`;
	
	// Upload file
	const blockBlobClient = container.getBlockBlobClient(uniqueFilename);
	await blockBlobClient.upload(buffer, buffer.length, {
		blobHTTPHeaders: {
			blobContentType: contentType
		}
	});
	
	return {
		url: blockBlobClient.url,
		name: filename,
		size: buffer.length,
		type: contentType,
		uploadedAt: new Date()
	};
}

export async function deleteFile(url: string): Promise<void> {
	const container = await getContainerClient();
	
	// Extract blob name from URL
	const urlParts = new URL(url);
	const pathParts = urlParts.pathname.split('/');
	const blobName = pathParts[pathParts.length - 1];
	
	const blockBlobClient = container.getBlockBlobClient(blobName);
	await blockBlobClient.delete();
}

export async function listFiles(prefix?: string): Promise<MediaFile[]> {
	const container = await getContainerClient();
	const files: MediaFile[] = [];
	
	// List blobs
	for await (const blob of container.listBlobsFlat({ prefix })) {
		if (blob.properties) {
			files.push({
				url: `${container.url}/${blob.name}`,
				name: blob.name,
				size: blob.properties.contentLength || 0,
				type: blob.properties.contentType || 'application/octet-stream',
				uploadedAt: blob.properties.lastModified || new Date()
			});
		}
	}
	
	return files.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
}
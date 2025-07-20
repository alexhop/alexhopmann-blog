import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { uploadFile, listFiles } from '$lib/server/storage';
import { hasRole } from '$lib/server/auth';

export const GET: RequestHandler = async ({ locals }) => {
	// Check authentication
	if (!locals.user || !hasRole(locals.user, 'author')) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}
	
	try {
		const files = await listFiles();
		return json({ files });
	} catch (error) {
		console.error('Error listing files:', error);
		return json({ error: 'Failed to list files' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request, locals }) => {
	// Check authentication
	if (!locals.user || !hasRole(locals.user, 'author')) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}
	
	try {
		const formData = await request.formData();
		const file = formData.get('file') as File;
		
		if (!file || typeof file === 'string') {
			return json({ error: 'No file provided' }, { status: 400 });
		}
		
		// Validate file type
		const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];
		if (!allowedTypes.includes(file.type)) {
			return json({ error: 'Invalid file type' }, { status: 400 });
		}
		
		// Validate file size (max 50MB)
		const maxSize = 50 * 1024 * 1024;
		if (file.size > maxSize) {
			return json({ error: 'File too large (max 50MB)' }, { status: 400 });
		}
		
		// Convert file to buffer
		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);
		
		// Upload to Azure
		const mediaFile = await uploadFile(file.name, buffer, file.type);
		
		return json({ file: mediaFile }, { status: 201 });
	} catch (error) {
		console.error('Error uploading file:', error);
		return json({ error: 'Failed to upload file' }, { status: 500 });
	}
};
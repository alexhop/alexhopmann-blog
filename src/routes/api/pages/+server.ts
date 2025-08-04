import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { getPages, createPage } from '$lib/server/pages';
import { authenticate } from '$lib/server/auth';
import { apiRateLimiter, writeRateLimiter } from '$lib/server/rate-limit';

export const GET: RequestHandler = async (event) => {
	// Apply rate limiting
	if (!await apiRateLimiter(event)) {
		return json({ error: 'Rate limit exceeded' }, { status: 429 });
	}
	
	try {
		const status = event.url.searchParams.get('status') as 'draft' | 'published' | null;
		const pages = await getPages(status || undefined);
		return json(pages);
	} catch (error) {
		console.error('Error fetching pages:', error);
		return json({ error: 'Failed to fetch pages' }, { status: 500 });
	}
};

export const POST: RequestHandler = async (event) => {
	// Apply rate limiting
	if (!await writeRateLimiter(event)) {
		return json({ error: 'Rate limit exceeded' }, { status: 429 });
	}
	
	// Authenticate user
	const user = await authenticate(event);
	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}
	
	// Check if user has permission to create pages
	if (!user.roles.includes('admin') && !user.roles.includes('author')) {
		return json({ error: 'Forbidden' }, { status: 403 });
	}
	
	try {
		const data = await event.request.json();
		
		// Validate required fields
		if (!data.title || !data.content || !data.slug) {
			return json({ error: 'Missing required fields' }, { status: 400 });
		}
		
		const page = await createPage({
			title: data.title,
			slug: data.slug,
			content: data.content,
			excerpt: data.excerpt || '',
			status: data.status || 'draft',
			order: data.order || 0,
			showInSidebar: data.showInSidebar || false,
			metaDescription: data.metaDescription,
			featuredImage: data.featuredImage,
			author: {
				id: user.id,
				name: user.name,
				email: user.email
			}
		});
		
		return json(page, { status: 201 });
	} catch (error) {
		console.error('Error creating page:', error);
		return json({ error: 'Failed to create page' }, { status: 500 });
	}
};
import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { getPageBySlug, updatePage, deletePage } from '$lib/server/pages';
import { authenticate } from '$lib/server/auth';
import { apiRateLimiter, writeRateLimiter } from '$lib/server/rate-limit';

export const GET: RequestHandler = async (event) => {
	// Apply rate limiting
	if (!await apiRateLimiter(event)) {
		return json({ error: 'Rate limit exceeded' }, { status: 429 });
	}
	
	const { slug } = event.params;
	
	try {
		const page = await getPageBySlug(slug);
		if (!page) {
			return json({ error: 'Page not found' }, { status: 404 });
		}
		
		return json(page);
	} catch (error) {
		console.error('Error fetching page:', error);
		return json({ error: 'Failed to fetch page' }, { status: 500 });
	}
};

export const PUT: RequestHandler = async (event) => {
	// Apply rate limiting
	if (!await writeRateLimiter(event)) {
		return json({ error: 'Rate limit exceeded' }, { status: 429 });
	}
	
	// Authenticate user
	const user = await authenticate(event);
	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}
	
	// Check if user has permission to edit pages
	if (!user.roles.includes('admin') && !user.roles.includes('author')) {
		return json({ error: 'Forbidden' }, { status: 403 });
	}
	
	const { slug } = event.params;
	
	try {
		// First get the page by slug to get its ID
		const existingPage = await getPageBySlug(slug);
		if (!existingPage) {
			return json({ error: 'Page not found' }, { status: 404 });
		}
		
		const data = await event.request.json();
		const updatedPage = await updatePage(existingPage.id, data);
		
		if (!updatedPage) {
			return json({ error: 'Failed to update page' }, { status: 500 });
		}
		
		return json(updatedPage);
	} catch (error) {
		console.error('Error updating page:', error);
		return json({ error: 'Failed to update page' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async (event) => {
	// Apply rate limiting
	if (!await writeRateLimiter(event)) {
		return json({ error: 'Rate limit exceeded' }, { status: 429 });
	}
	
	// Authenticate user
	const user = await authenticate(event);
	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}
	
	// Check if user has permission to delete pages
	if (!user.roles.includes('admin')) {
		return json({ error: 'Forbidden' }, { status: 403 });
	}
	
	const { slug } = event.params;
	
	try {
		// First get the page by slug to get its ID
		const page = await getPageBySlug(slug);
		if (!page) {
			return json({ error: 'Page not found' }, { status: 404 });
		}
		
		const success = await deletePage(page.id);
		if (!success) {
			return json({ 
				error: 'Failed to delete page',
				details: {
					message: 'Database operation failed',
					pageId: page.id
				}
			}, { status: 500 });
		}
		
		return json({ success: true });
	} catch (error: any) {
		console.error('Error deleting page:', error);
		
		const errorResponse = {
			error: 'Failed to delete page',
			details: {
				message: error.message || 'Unknown error',
				code: error.code,
				statusCode: error.statusCode
			}
		};
		
		return json(errorResponse, { status: 500 });
	}
};
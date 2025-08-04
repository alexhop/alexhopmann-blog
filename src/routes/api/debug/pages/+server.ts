import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { getDatabase } from '$lib/server/cosmos';
import { initializePagesContainer, getPages } from '$lib/server/pages';

export const GET: RequestHandler = async () => {
	try {
		// Initialize pages container
		await initializePagesContainer();
		
		// Get database and check containers
		const database = await getDatabase();
		const { resources: containers } = await database.containers.readAll().fetchAll();
		
		// Try to get pages
		const pages = await getPages();
		
		return json({
			success: true,
			containers: containers.map(c => c.id),
			pagesCount: pages.length,
			pages: pages.map(p => ({
				id: p.id,
				title: p.title,
				slug: p.slug,
				status: p.status,
				showInSidebar: p.showInSidebar
			})),
			initialized: true
		});
	} catch (error: any) {
		return json({
			success: false,
			error: error.message,
			code: error.code,
			statusCode: error.statusCode,
			details: error
		}, { status: 500 });
	}
};
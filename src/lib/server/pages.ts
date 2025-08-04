import { getDatabase } from './cosmos';
import type { Database, Container } from '@azure/cosmos';
import { config } from '$lib/config';

export interface Page {
	id: string;
	slug: string;
	title: string;
	content: string;
	excerpt?: string;
	author: {
		id: string;
		name: string;
		email: string;
	};
	status: 'draft' | 'published';
	order?: number; // For sidebar ordering
	showInSidebar: boolean;
	metaDescription?: string;
	featuredImage?: string;
	createdAt: Date;
	updatedAt: Date;
	publishedAt?: Date;
}

let database: Database;
let container: Container;

// Initialize pages container if it doesn't exist
export async function initializePagesContainer() {
	try {
		database = await getDatabase();
		await database.containers.createIfNotExists({
			id: 'pages',
			partitionKey: { paths: ['/id'] }
		});
		container = database.container('pages');
		console.log('Pages container initialized');
	} catch (error) {
		console.error('Error initializing pages container:', error);
	}
}

async function ensureContainer() {
	if (!container) {
		await initializePagesContainer();
	}
}

export async function getPages(status?: 'draft' | 'published'): Promise<Page[]> {
	try {
		await ensureContainer();
		
		let query = 'SELECT * FROM c WHERE 1=1';
		const parameters: any[] = [];
		
		if (status) {
			query += ' AND c.status = @status';
			parameters.push({ name: '@status', value: status });
		}
		
		query += ' ORDER BY c.order ASC, c.createdAt DESC';
		
		const { resources } = await container.items
			.query({ query, parameters })
			.fetchAll();
		
		return resources.map(formatPage);
	} catch (error) {
		console.error('Error fetching pages:', error);
		return [];
	}
}

export async function getPublishedPages(): Promise<Page[]> {
	return getPages('published');
}

export async function getPagesForSidebar(): Promise<Page[]> {
	try {
		await ensureContainer();
		
		const query = 'SELECT * FROM c WHERE c.status = @status AND c.showInSidebar = @showInSidebar ORDER BY c.order ASC, c.title ASC';
		const parameters = [
			{ name: '@status', value: 'published' },
			{ name: '@showInSidebar', value: true }
		];
		
		const { resources } = await container.items
			.query({ query, parameters })
			.fetchAll();
		
		return resources.map(formatPage);
	} catch (error) {
		console.error('Error fetching sidebar pages:', error);
		return [];
	}
}

export async function getPageBySlug(slug: string): Promise<Page | null> {
	try {
		await ensureContainer();
		
		const query = 'SELECT * FROM c WHERE c.slug = @slug';
		const { resources } = await container.items
			.query({
				query,
				parameters: [{ name: '@slug', value: slug }]
			})
			.fetchAll();
		
		if (resources.length === 0) return null;
		return formatPage(resources[0]);
	} catch (error) {
		console.error('Error fetching page by slug:', error);
		return null;
	}
}

export async function getPageById(id: string): Promise<Page | null> {
	try {
		await ensureContainer();
		const { resource } = await container.item(id, id).read();
		if (!resource) return null;
		return formatPage(resource);
	} catch (error) {
		console.error('Error fetching page by id:', error);
		return null;
	}
}

export async function createPage(page: Omit<Page, 'id' | 'createdAt' | 'updatedAt'>): Promise<Page> {
	await ensureContainer();
	
	const id = generateId();
	const now = new Date();
	
	const newPage: Page = {
		...page,
		id,
		createdAt: now,
		updatedAt: now,
		publishedAt: page.status === 'published' ? now : undefined
	};
	
	const { resource } = await container.items.create(newPage);
	return formatPage(resource!);
}

export async function updatePage(id: string, updates: Partial<Page>): Promise<Page | null> {
	try {
		const existing = await getPageById(id);
		if (!existing) return null;
		
		const updatedPage = {
			...existing,
			...updates,
			id, // Ensure ID doesn't change
			updatedAt: new Date(),
			publishedAt: updates.status === 'published' && !existing.publishedAt 
				? new Date() 
				: existing.publishedAt
		};
		
		const { resource } = await container.item(id, id).replace(updatedPage);
		return formatPage(resource!);
	} catch (error) {
		console.error('Error updating page:', error);
		return null;
	}
}

export async function deletePage(id: string): Promise<boolean> {
	try {
		await ensureContainer();
		await container.item(id, id).delete();
		return true;
	} catch (error) {
		console.error('Error deleting page:', error);
		return false;
	}
}

function formatPage(raw: any): Page {
	return {
		...raw,
		createdAt: new Date(raw.createdAt),
		updatedAt: new Date(raw.updatedAt),
		publishedAt: raw.publishedAt ? new Date(raw.publishedAt) : undefined
	};
}

function generateId(): string {
	return `page-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
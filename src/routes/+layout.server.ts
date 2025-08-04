import type { LayoutServerLoad } from './$types';
import { getPagesForSidebar } from '$lib/server/pages';

export const load: LayoutServerLoad = async () => {
	const sidebarPages = await getPagesForSidebar();
	
	return {
		sidebarPages
	};
};
import type { Actions, PageServerLoad } from './$types';
import { config } from '$lib/config';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ url, locals }) => {
	if (locals.user) {
		redirect(303, '/admin');
	}
	
	const error = url.searchParams.get('error');
	return {
		error,
		authUrl: getAuthUrl(url.origin)
	};
};

function getAuthUrl(origin: string): string {
	const authority = config.auth.authority;
	const clientId = config.auth.clientId;
	const redirectUri = encodeURIComponent(`${origin}/auth/callback`);
	const responseType = 'code';
	const scope = encodeURIComponent('openid profile email User.Read');
	const responseMode = 'query';
	
	return `${authority}/oauth2/v2.0/authorize?` +
		`client_id=${clientId}&` +
		`response_type=${responseType}&` +
		`redirect_uri=${redirectUri}&` +
		`scope=${scope}&` +
		`response_mode=${responseMode}`;
}
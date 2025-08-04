import type { RequestHandler } from './$types';
import { config } from '$lib/config';
import { getUserByEmail, createUser, updateUser, generateToken } from '$lib/server/auth';
import { redirect, error } from '@sveltejs/kit';
import { isAuthorizedEmail, getAuthorizedUser } from '$lib/server/authorized-users';
import { authRateLimiter } from '$lib/server/rate-limit';

export const GET: RequestHandler = async (event) => {
	// Apply rate limiting for auth attempts
	if (!await authRateLimiter(event)) {
		redirect(303, '/auth/login?error=rate_limit');
	}
	
	const { url, cookies } = event;
	const code = url.searchParams.get('code');
	const errorParam = url.searchParams.get('error');
	
	if (errorParam || !code) {
		redirect(303, '/auth/login?error=1');
	}
	
	try {
		// Exchange code for token
		const tokenResponse = await exchangeCodeForToken(code, url.origin);
		
		// Get user info from token
		const userInfo = await getUserInfo(tokenResponse.access_token);
		
		// Check if user is authorized
		if (!isAuthorizedEmail(userInfo.email)) {
			console.warn(`Unauthorized login attempt from: ${userInfo.email}`);
			redirect(303, '/auth/login?error=unauthorized');
		}
		
		// Get authorized user configuration
		const authorizedUser = getAuthorizedUser(userInfo.email);
		if (!authorizedUser) {
			redirect(303, '/auth/login?error=unauthorized');
		}
		
		// Find or create user
		let user = await getUserByEmail(userInfo.email);
		if (!user) {
			// First time login - create user with authorized roles
			user = await createUser({
				email: userInfo.email,
				name: authorizedUser.name || userInfo.name || userInfo.email,
				roles: authorizedUser.roles,
				avatar: userInfo.picture
			});
		} else {
			// Update existing user's roles to match authorized configuration
			if (JSON.stringify(user.roles) !== JSON.stringify(authorizedUser.roles)) {
				user = await updateUser(user.id, user.email, {
					roles: authorizedUser.roles
				});
			}
		}
		
		// Generate JWT token
		const token = generateToken(user);
		
		// Set cookie
		cookies.set('auth-token', token, {
			path: '/',
			httpOnly: true,
			secure: true,
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 7 // 7 days
		});
		
		redirect(303, '/admin');
	} catch (err) {
		console.error('Auth callback error:', err);
		redirect(303, '/auth/login?error=1');
	}
};

async function exchangeCodeForToken(code: string, origin: string) {
	const authority = config.auth.authority;
	// Use the configured site URL if available, otherwise fall back to the origin
	const siteUrl = config.site.url || origin;
	
	const response = await fetch(
		`${authority}/oauth2/v2.0/token`,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			body: new URLSearchParams({
				grant_type: 'authorization_code',
				client_id: config.auth.clientId,
				client_secret: config.auth.clientSecret,
				code: code,
				redirect_uri: `${siteUrl}/auth/callback`,
				scope: 'openid profile email User.Read'
			})
		}
	);
	
	if (!response.ok) {
		const errorText = await response.text();
		console.error('Token exchange failed:', errorText);
		throw new Error('Failed to exchange code for token');
	}
	
	return response.json();
}

async function getUserInfo(accessToken: string) {
	// Use Microsoft Graph API to get user info
	const response = await fetch('https://graph.microsoft.com/v1.0/me', {
		headers: {
			Authorization: `Bearer ${accessToken}`
		}
	});
	
	if (!response.ok) {
		// Fallback: decode the ID token
		const payload = parseJwt(accessToken);
		return {
			email: payload.preferred_username || payload.email || payload.upn,
			name: payload.name || payload.given_name || 'User',
			picture: payload.picture
		};
	}
	
	const graphUser = await response.json();
	return {
		email: graphUser.mail || graphUser.userPrincipalName,
		name: graphUser.displayName || graphUser.givenName || 'User',
		picture: graphUser.photo
	};
}

function parseJwt(token: string) {
	const base64Url = token.split('.')[1];
	const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
	const jsonPayload = decodeURIComponent(
		atob(base64)
			.split('')
			.map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
			.join('')
	);
	
	return JSON.parse(jsonPayload);
}
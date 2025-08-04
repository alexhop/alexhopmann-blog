import type { Handle } from '@sveltejs/kit';
import { verifyToken } from '$lib/server/auth';
import { telemetry } from '$lib/server/telemetry';

export const handle: Handle = async ({ event, resolve }) => {
	const startTime = performance.now();
	// Get the auth token from cookies
	const token = event.cookies.get('auth-token');
	
	if (token) {
		const payload = verifyToken(token);
		if (payload) {
			event.locals.user = {
				id: payload.userId,
				email: payload.email,
				name: payload.name,
				roles: payload.roles
			};
		}
	}
	
	// Track the request
	try {
		const response = await resolve(event);
		
		// Add security headers
		response.headers.set('X-Frame-Options', 'DENY');
		response.headers.set('X-Content-Type-Options', 'nosniff');
		response.headers.set('X-XSS-Protection', '1; mode=block');
		response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
		response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
		
		// Content Security Policy
		const csp = [
			"default-src 'self'",
			"script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google-analytics.com https://www.googletagmanager.com",
			"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
			"font-src 'self' https://fonts.gstatic.com",
			"img-src 'self' data: https: blob:",
			"connect-src 'self' https://www.google-analytics.com https://login.microsoftonline.com https://graph.microsoft.com https://dc.services.visualstudio.com",
			"frame-ancestors 'none'",
			"base-uri 'self'",
			"form-action 'self'"
		].join('; ');
		
		response.headers.set('Content-Security-Policy', csp);
		
		// Strict Transport Security (HSTS) - only on HTTPS
		if (event.url.protocol === 'https:') {
			response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
		}
		
		// Track page view
		const duration = performance.now() - startTime;
		telemetry.trackPageView({
			name: event.route.id || 'unknown',
			url: event.url.pathname,
			duration,
			properties: {
				method: event.request.method,
				userAgent: event.request.headers.get('user-agent') || 'unknown',
				authenticated: event.locals.user ? 'true' : 'false'
			}
		});
		
		// Track metrics
		telemetry.trackMetric('request.duration', duration, {
			route: event.route.id || 'unknown',
			method: event.request.method
		});
		
		return response;
	} catch (error) {
		// Track exception
		telemetry.trackException({
			error: error as Error,
			properties: {
				route: event.route.id || 'unknown',
				url: event.url.pathname,
				method: event.request.method
			}
		});
		throw error;
	}
};
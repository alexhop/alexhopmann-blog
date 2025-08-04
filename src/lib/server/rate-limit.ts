import type { RequestEvent } from '@sveltejs/kit';

interface RateLimitEntry {
	count: number;
	resetAt: number;
}

// In-memory store for rate limiting (consider Redis for production)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
	const now = Date.now();
	for (const [key, entry] of rateLimitStore.entries()) {
		if (entry.resetAt < now) {
			rateLimitStore.delete(key);
		}
	}
}, 5 * 60 * 1000);

export interface RateLimitConfig {
	windowMs: number; // Time window in milliseconds
	max: number; // Maximum requests per window
	message?: string; // Error message
	keyGenerator?: (event: RequestEvent) => string; // Custom key generator
}

const defaultConfig: RateLimitConfig = {
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 100, // 100 requests per window
	message: 'Too many requests, please try again later.',
	keyGenerator: (event) => {
		// Use IP address as default key
		const forwarded = event.request.headers.get('x-forwarded-for');
		const ip = forwarded ? forwarded.split(',')[0].trim() : 
				  event.request.headers.get('x-real-ip') || 
				  event.getClientAddress();
		return ip;
	}
};

export function createRateLimiter(config: Partial<RateLimitConfig> = {}) {
	const finalConfig = { ...defaultConfig, ...config };
	
	return async function rateLimit(event: RequestEvent): Promise<boolean> {
		const key = finalConfig.keyGenerator!(event);
		const now = Date.now();
		
		let entry = rateLimitStore.get(key);
		
		if (!entry || entry.resetAt < now) {
			// Create new entry
			entry = {
				count: 1,
				resetAt: now + finalConfig.windowMs
			};
			rateLimitStore.set(key, entry);
			return true; // Allow request
		}
		
		// Increment count
		entry.count++;
		
		if (entry.count > finalConfig.max) {
			// Rate limit exceeded
			return false;
		}
		
		return true; // Allow request
	};
}

// Pre-configured rate limiters for different endpoints
export const apiRateLimiter = createRateLimiter({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 100 // 100 requests per 15 minutes
});

export const authRateLimiter = createRateLimiter({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 5 // 5 login attempts per 15 minutes
});

export const writeRateLimiter = createRateLimiter({
	windowMs: 60 * 1000, // 1 minute
	max: 10 // 10 write operations per minute
});
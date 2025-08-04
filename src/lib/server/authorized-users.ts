// Authorized users configuration
// Only these users can access the admin portal

export interface AuthorizedUser {
	email: string;
	roles: string[];
	name?: string;
}

// List of authorized users
export const AUTHORIZED_USERS: AuthorizedUser[] = [
	{
		email: 'alex@hopmann.org',
		roles: ['admin', 'author'],
		name: 'Alex Hopmann'
	},
	{
		email: 'ahopmann@hotmail.com',
		roles: ['admin', 'author'],
		name: 'Alex Hopmann'
	}
];

// Check if an email is authorized
export function isAuthorizedEmail(email: string): boolean {
	return AUTHORIZED_USERS.some(user => 
		user.email.toLowerCase() === email.toLowerCase()
	);
}

// Get authorized user configuration
export function getAuthorizedUser(email: string): AuthorizedUser | null {
	return AUTHORIZED_USERS.find(user => 
		user.email.toLowerCase() === email.toLowerCase()
	) || null;
}
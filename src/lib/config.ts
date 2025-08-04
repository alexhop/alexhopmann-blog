export const config = {
	cosmos: {
		endpoint: process.env.COSMOS_ENDPOINT || '',
		key: process.env.COSMOS_KEY || '',
		databaseId: process.env.COSMOS_DATABASE || 'alexhopmann-blog',
		containers: {
			posts: process.env.COSMOS_CONTAINER_POSTS || 'posts',
			comments: process.env.COSMOS_CONTAINER_COMMENTS || 'comments',
			users: process.env.COSMOS_CONTAINER_USERS || 'users'
		}
	},
	storage: {
		accountName: process.env.AZURE_STORAGE_ACCOUNT_NAME || '',
		accountKey: process.env.AZURE_STORAGE_ACCOUNT_KEY || '',
		containerName: process.env.AZURE_STORAGE_CONTAINER_NAME || 'blog-media'
	},
	auth: {
		tenantId: process.env.AZURE_AD_TENANT_ID || '',
		clientId: process.env.AZURE_AD_CLIENT_ID || '',
		clientSecret: process.env.AZURE_AD_CLIENT_SECRET || '',
		authority: process.env.AZURE_AD_AUTHORITY || 'https://login.microsoftonline.com/common',
		jwtSecret: process.env.JWT_SECRET || ''
	},
	site: {
		url: process.env.SITE_URL || 'http://localhost:3000'
	},
	authorizedUsers: process.env.AUTHORIZED_USERS || ''
};
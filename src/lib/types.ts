export interface BlogPost {
	id: string;
	slug: string;
	title: string;
	content: string;
	excerpt: string;
	author: Author;
	categories: string[];
	tags: string[];
	status: 'draft' | 'published';
	publishedAt?: Date;
	createdAt: Date;
	updatedAt: Date;
	featuredImage?: string;
	views: number;
}

export interface Author {
	id: string;
	name: string;
	email: string;
	avatar?: string;
}

export interface Comment {
	id: string;
	postId: string;
	author: {
		name: string;
		email: string;
		avatar?: string;
	};
	content: string;
	createdAt: Date;
	approved: boolean;
	parentId?: string;
}

export interface User {
	id: string;
	email: string;
	name: string;
	roles: string[];
	avatar?: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface MediaFile {
	url: string;
	name: string;
	size: number;
	type: string;
	uploadedAt: Date;
}
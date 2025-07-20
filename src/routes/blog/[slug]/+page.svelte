<script lang="ts">
	import { page } from '$app/stores';
	import Comments from '$lib/components/Comments.svelte';
	
	export let data;
	
	function formatDate(date: Date | string) {
		return new Date(date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}
	
	$: shareUrl = `${$page.url.origin}/blog/${data.post.slug}`;
</script>

<svelte:head>
	<title>{data.post.title} - Alex Hopmann</title>
	<meta name="description" content={data.post.excerpt || data.post.title} />
	<meta property="og:title" content={data.post.title} />
	<meta property="og:description" content={data.post.excerpt || data.post.title} />
	{#if data.post.featuredImage}
		<meta property="og:image" content={data.post.featuredImage} />
	{/if}
	<meta property="og:url" content={shareUrl} />
	<meta property="og:type" content="article" />
	<meta property="article:published_time" content={data.post.publishedAt || data.post.createdAt} />
	<meta property="article:author" content={data.post.author.name} />
	{#each data.post.tags as tag}
		<meta property="article:tag" content={tag} />
	{/each}
</svelte:head>

<article class="container blog-post">
	<header class="post-header">
		<div class="post-meta">
			<span class="post-date">{formatDate(data.post.publishedAt || data.post.createdAt)}</span>
			{#if data.post.categories.length > 0}
				<span class="separator">•</span>
				{#each data.post.categories as category, i}
					<span class="post-category">{category}</span>
					{#if i < data.post.categories.length - 1}
						<span class="separator">•</span>
					{/if}
				{/each}
			{/if}
			<span class="separator">•</span>
			<span class="post-views">{data.post.views} views</span>
		</div>
		
		<h1>{data.post.title}</h1>
		
		{#if data.post.excerpt}
			<p class="post-excerpt">{data.post.excerpt}</p>
		{/if}
		
		<div class="author-info">
			{#if data.post.author.avatar}
				<img src={data.post.author.avatar} alt={data.post.author.name} class="author-avatar" />
			{/if}
			<div>
				<div class="author-name">By {data.post.author.name}</div>
			</div>
		</div>
	</header>
	
	{#if data.post.featuredImage}
		<div class="featured-image">
			<img src={data.post.featuredImage} alt={data.post.title} />
		</div>
	{/if}
	
	<div class="post-content">
		{@html data.post.content}
	</div>
	
	{#if data.post.tags.length > 0}
		<div class="post-tags">
			<h3>Tags:</h3>
			<div class="tags-list">
				{#each data.post.tags as tag}
					<span class="tag">{tag}</span>
				{/each}
			</div>
		</div>
	{/if}
	
	<div class="share-section">
		<h3>Share this post:</h3>
		<div class="share-buttons">
			<a 
				href="https://twitter.com/intent/tweet?text={encodeURIComponent(data.post.title)}&url={encodeURIComponent(shareUrl)}"
				target="_blank"
				rel="noopener noreferrer"
				class="share-button twitter"
			>
				Twitter
			</a>
			<a 
				href="https://www.linkedin.com/sharing/share-offsite/?url={encodeURIComponent(shareUrl)}"
				target="_blank"
				rel="noopener noreferrer"
				class="share-button linkedin"
			>
				LinkedIn
			</a>
			<a 
				href="https://www.facebook.com/sharer/sharer.php?u={encodeURIComponent(shareUrl)}"
				target="_blank"
				rel="noopener noreferrer"
				class="share-button facebook"
			>
				Facebook
			</a>
		</div>
	</div>
	
	<Comments postSlug={data.post.slug} />
</article>

<style>
	.blog-post {
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem 1rem;
	}
	
	.post-header {
		margin-bottom: 2rem;
	}
	
	.post-meta {
		font-size: 0.9rem;
		color: #666;
		margin-bottom: 1rem;
	}
	
	.separator {
		margin: 0 0.5rem;
	}
	
	.post-category {
		color: var(--primary-color);
	}
	
	h1 {
		font-size: 2.5rem;
		line-height: 1.2;
		margin-bottom: 1rem;
	}
	
	.post-excerpt {
		font-size: 1.25rem;
		color: #555;
		line-height: 1.5;
		margin-bottom: 1.5rem;
	}
	
	.author-info {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem 0;
		border-top: 1px solid var(--border-color);
		border-bottom: 1px solid var(--border-color);
	}
	
	.author-avatar {
		width: 48px;
		height: 48px;
		border-radius: 50%;
		object-fit: cover;
	}
	
	.author-name {
		font-weight: 500;
	}
	
	.featured-image {
		margin: 2rem -1rem;
		overflow: hidden;
		border-radius: 8px;
	}
	
	.featured-image img {
		width: 100%;
		height: auto;
		display: block;
	}
	
	.post-content {
		font-size: 1.1rem;
		line-height: 1.8;
		margin-bottom: 3rem;
	}
	
	:global(.post-content h1),
	:global(.post-content h2),
	:global(.post-content h3) {
		margin: 2rem 0 1rem;
		line-height: 1.3;
	}
	
	:global(.post-content h1) {
		font-size: 2rem;
	}
	
	:global(.post-content h2) {
		font-size: 1.5rem;
	}
	
	:global(.post-content h3) {
		font-size: 1.25rem;
	}
	
	:global(.post-content p) {
		margin-bottom: 1.5rem;
	}
	
	:global(.post-content ul),
	:global(.post-content ol) {
		margin-bottom: 1.5rem;
		padding-left: 2rem;
	}
	
	:global(.post-content li) {
		margin-bottom: 0.5rem;
	}
	
	:global(.post-content pre) {
		background: #f5f5f5;
		padding: 1rem;
		border-radius: 4px;
		overflow-x: auto;
		margin-bottom: 1.5rem;
	}
	
	:global(.post-content code) {
		background: #f5f5f5;
		padding: 0.2rem 0.4rem;
		border-radius: 3px;
		font-size: 0.9em;
	}
	
	:global(.post-content pre code) {
		background: none;
		padding: 0;
	}
	
	:global(.post-content img) {
		max-width: 100%;
		height: auto;
		margin: 1.5rem 0;
		border-radius: 4px;
	}
	
	:global(.post-content blockquote) {
		border-left: 4px solid var(--primary-color);
		padding-left: 1rem;
		margin: 1.5rem 0;
		font-style: italic;
		color: #666;
	}
	
	.post-tags {
		margin-bottom: 2rem;
		padding-top: 2rem;
		border-top: 1px solid var(--border-color);
	}
	
	.post-tags h3 {
		font-size: 1rem;
		margin-bottom: 1rem;
		color: #666;
	}
	
	.tags-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}
	
	.tag {
		padding: 0.25rem 0.75rem;
		background: #f0f0f0;
		border-radius: 20px;
		font-size: 0.9rem;
		color: #666;
	}
	
	.share-section {
		padding: 2rem 0;
		border-top: 1px solid var(--border-color);
	}
	
	.share-section h3 {
		font-size: 1rem;
		margin-bottom: 1rem;
		color: #666;
	}
	
	.share-buttons {
		display: flex;
		gap: 1rem;
	}
	
	.share-button {
		padding: 0.5rem 1rem;
		border-radius: 4px;
		color: white;
		font-weight: 500;
		transition: transform 0.2s;
	}
	
	.share-button:hover {
		transform: translateY(-2px);
		text-decoration: none;
	}
	
	.share-button.twitter {
		background: #1da1f2;
	}
	
	.share-button.linkedin {
		background: #0077b5;
	}
	
	.share-button.facebook {
		background: #1877f2;
	}
	
	@media (max-width: 768px) {
		h1 {
			font-size: 2rem;
		}
		
		.featured-image {
			margin: 2rem -1rem;
		}
	}
</style>
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
		padding: 3rem 1rem;
	}
	
	.post-header {
		margin-bottom: 3rem;
		text-align: center;
	}
	
	.post-meta {
		font-size: 0.875rem;
		color: var(--text-light);
		margin-bottom: 1.5rem;
		font-weight: 500;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		flex-wrap: wrap;
	}
	
	.post-date {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	
	.post-date::before {
		content: '';
		width: 4px;
		height: 4px;
		border-radius: 50%;
		background: var(--primary-color);
	}
	
	.separator {
		color: var(--border-color);
	}
	
	.post-category {
		color: var(--primary-color);
		background: rgba(99, 102, 241, 0.1);
		padding: 0.25rem 0.75rem;
		border-radius: var(--radius-sm);
		font-size: 0.8rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	
	.post-views {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	
	h1 {
		font-size: clamp(2rem, 5vw, 3rem);
		line-height: 1.2;
		margin-bottom: 1.5rem;
		font-weight: 800;
		letter-spacing: -0.03em;
		color: var(--text-color);
	}
	
	.post-excerpt {
		font-size: 1.25rem;
		color: var(--text-light);
		line-height: 1.6;
		margin-bottom: 2rem;
		font-weight: 400;
		max-width: 600px;
		margin-left: auto;
		margin-right: auto;
	}
	
	.author-info {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		padding: 1.5rem 0;
		border-top: 2px solid var(--background-gray);
		border-bottom: 2px solid var(--background-gray);
	}
	
	.author-avatar {
		width: 56px;
		height: 56px;
		border-radius: 50%;
		object-fit: cover;
		border: 3px solid var(--background-gray);
		box-shadow: var(--shadow-md);
	}
	
	.author-name {
		font-weight: 600;
		color: var(--text-color);
		font-size: 1rem;
	}
	
	.featured-image {
		margin: 3rem -1rem;
		overflow: hidden;
		border-radius: var(--radius-xl);
		box-shadow: var(--shadow-lg);
		position: relative;
	}
	
	.featured-image::after {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(to bottom, transparent 70%, rgba(0, 0, 0, 0.05));
		pointer-events: none;
	}
	
	.featured-image img {
		width: 100%;
		height: auto;
		display: block;
	}
	
	.post-content {
		font-size: 1.125rem;
		line-height: 1.8;
		margin-bottom: 4rem;
		color: var(--text-color);
	}
	
	:global(.post-content h1),
	:global(.post-content h2),
	:global(.post-content h3) {
		margin: 3rem 0 1.5rem;
		line-height: 1.3;
		font-weight: 700;
		letter-spacing: -0.025em;
		color: var(--text-color);
	}
	
	:global(.post-content h1) {
		font-size: 2.25rem;
		position: relative;
		padding-bottom: 1rem;
	}
	
	:global(.post-content h1::after) {
		content: '';
		position: absolute;
		bottom: 0;
		left: 0;
		width: 60px;
		height: 4px;
		background: var(--primary-color);
		border-radius: 2px;
	}
	
	:global(.post-content h2) {
		font-size: 1.75rem;
		margin-top: 3rem;
	}
	
	:global(.post-content h3) {
		font-size: 1.375rem;
		color: var(--text-light);
	}
	
	:global(.post-content p) {
		margin-bottom: 1.75rem;
		color: var(--text-color);
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
		background: var(--text-color);
		color: white;
		padding: 1.5rem;
		border-radius: var(--radius-lg);
		overflow-x: auto;
		margin: 2rem 0;
		box-shadow: var(--shadow-lg);
		font-size: 0.9rem;
		line-height: 1.6;
	}
	
	:global(.post-content code) {
		background: rgba(99, 102, 241, 0.1);
		color: var(--primary-color);
		padding: 0.2rem 0.5rem;
		border-radius: var(--radius-sm);
		font-size: 0.875em;
		font-weight: 500;
	}
	
	:global(.post-content pre code) {
		background: none;
		color: inherit;
		padding: 0;
		font-weight: normal;
	}
	
	:global(.post-content img) {
		max-width: 100%;
		height: auto;
		margin: 2rem 0;
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-md);
	}
	
	:global(.post-content blockquote) {
		position: relative;
		padding: 1.5rem 2rem;
		margin: 2rem 0;
		background: var(--background-gray);
		border-radius: var(--radius-lg);
		font-style: italic;
		color: var(--text-light);
		border-left: 4px solid var(--primary-color);
	}
	
	:global(.post-content blockquote::before) {
		content: '"';
		position: absolute;
		top: -10px;
		left: 20px;
		font-size: 4rem;
		color: var(--primary-color);
		opacity: 0.3;
		font-family: Georgia, serif;
	}
	
	.post-tags {
		margin-bottom: 3rem;
		padding-top: 3rem;
		border-top: 2px solid var(--background-gray);
	}
	
	.post-tags h3 {
		font-size: 0.875rem;
		margin-bottom: 1rem;
		color: var(--text-light);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		font-weight: 600;
	}
	
	.tags-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
	}
	
	.tag {
		padding: 0.5rem 1rem;
		background: var(--background-gray);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-lg);
		font-size: 0.875rem;
		color: var(--text-light);
		font-weight: 500;
		transition: all 0.2s ease;
	}
	
	.tag:hover {
		background: var(--primary-color);
		color: white;
		border-color: var(--primary-color);
		transform: translateY(-2px);
		box-shadow: var(--shadow-sm);
	}
	
	.share-section {
		padding: 3rem 2rem;
		margin: 3rem -2rem;
		background: var(--background-gray);
		border-radius: var(--radius-xl);
		text-align: center;
	}
	
	.share-section h3 {
		font-size: 1.125rem;
		margin-bottom: 1.5rem;
		color: var(--text-color);
		font-weight: 600;
	}
	
	.share-buttons {
		display: flex;
		justify-content: center;
		gap: 1rem;
		flex-wrap: wrap;
	}
	
	.share-button {
		padding: 0.75rem 1.5rem;
		border-radius: var(--radius-lg);
		color: white;
		font-weight: 600;
		font-size: 0.9rem;
		transition: all 0.3s ease;
		position: relative;
		overflow: hidden;
	}
	
	.share-button::before {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		width: 0;
		height: 0;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.2);
		transform: translate(-50%, -50%);
		transition: width 0.6s, height 0.6s;
	}
	
	.share-button:hover {
		transform: translateY(-3px);
		box-shadow: var(--shadow-lg);
		text-decoration: none;
	}
	
	.share-button:hover::before {
		width: 200px;
		height: 200px;
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
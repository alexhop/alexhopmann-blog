<script lang="ts">
	import type { PageData } from './$types';
	import { sanitizeHtml } from '$lib/utils/sanitize';
	
	export let data: PageData;
	
	$: page = data.page;
	$: sanitizedContent = sanitizeHtml(page.content);
</script>

<svelte:head>
	<title>{page.title} | Alex Hopmann</title>
	{#if page.metaDescription}
		<meta name="description" content={page.metaDescription} />
	{:else if page.excerpt}
		<meta name="description" content={page.excerpt} />
	{/if}
</svelte:head>

<article class="page">
	<header class="page-header">
		<h1>{page.title}</h1>
		{#if page.excerpt}
			<p class="excerpt">{page.excerpt}</p>
		{/if}
	</header>
	
	{#if page.featuredImage}
		<div class="featured-image">
			<img src={page.featuredImage} alt={page.title} />
		</div>
	{/if}
	
	<div class="page-content">
		{@html sanitizedContent}
	</div>
	
	<footer class="page-footer">
		<div class="meta">
			<time datetime={page.publishedAt}>
				Last updated: {new Date(page.updatedAt).toLocaleDateString('en-US', {
					year: 'numeric',
					month: 'long',
					day: 'numeric'
				})}
			</time>
		</div>
	</footer>
</article>

<style>
	.page {
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem 1rem;
	}
	
	.page-header {
		margin-bottom: 2rem;
	}
	
	h1 {
		font-size: 2.5rem;
		margin-bottom: 1rem;
		line-height: 1.2;
	}
	
	.excerpt {
		font-size: 1.25rem;
		color: var(--text-secondary);
		line-height: 1.6;
	}
	
	.featured-image {
		margin-bottom: 2rem;
	}
	
	.featured-image img {
		width: 100%;
		height: auto;
		border-radius: 8px;
	}
	
	.page-content {
		font-size: 1.125rem;
		line-height: 1.8;
		color: var(--text-color);
	}
	
	.page-content :global(h2) {
		font-size: 1.875rem;
		margin-top: 2rem;
		margin-bottom: 1rem;
	}
	
	.page-content :global(h3) {
		font-size: 1.5rem;
		margin-top: 1.5rem;
		margin-bottom: 0.75rem;
	}
	
	.page-content :global(p) {
		margin-bottom: 1.5rem;
	}
	
	.page-content :global(ul),
	.page-content :global(ol) {
		margin-bottom: 1.5rem;
		padding-left: 2rem;
	}
	
	.page-content :global(li) {
		margin-bottom: 0.5rem;
	}
	
	.page-content :global(blockquote) {
		border-left: 4px solid var(--primary-color);
		padding-left: 1.5rem;
		margin: 2rem 0;
		font-style: italic;
		color: var(--text-secondary);
	}
	
	.page-content :global(pre) {
		background: #1e1e1e;
		color: #d4d4d4;
		padding: 1rem;
		border-radius: 4px;
		overflow-x: auto;
		margin-bottom: 1.5rem;
	}
	
	.page-content :global(code) {
		background: #f4f4f4;
		padding: 0.2rem 0.4rem;
		border-radius: 3px;
		font-size: 0.9em;
	}
	
	.page-content :global(pre code) {
		background: none;
		padding: 0;
	}
	
	.page-content :global(img) {
		max-width: 100%;
		height: auto;
		border-radius: 4px;
	}
	
	.page-content :global(a) {
		color: var(--primary-color);
		text-decoration: underline;
	}
	
	.page-content :global(a:hover) {
		color: var(--primary-hover);
	}
	
	.page-footer {
		margin-top: 3rem;
		padding-top: 2rem;
		border-top: 1px solid var(--border-color);
	}
	
	.meta {
		color: var(--text-secondary);
		font-size: 0.875rem;
	}
	
	@media (max-width: 768px) {
		h1 {
			font-size: 2rem;
		}
		
		.excerpt {
			font-size: 1.125rem;
		}
		
		.page-content {
			font-size: 1rem;
		}
	}
</style>
<script lang="ts">
	export let data;
	
	function formatDate(date: Date | string) {
		return new Date(date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>Blog - Alex Hopmann</title>
	<meta name="description" content="Tech blog posts by Alex Hopmann on software development, technology, and more" />
</svelte:head>

<div class="container">
	<div class="blog-header">
		<h1>Blog</h1>
		<p>Thoughts on technology, software development, and life</p>
	</div>
	
	{#if data.posts.length === 0}
		<div class="empty-state">
			<p>No blog posts yet. Check back soon!</p>
		</div>
	{:else}
		<div class="posts-list">
			{#each data.posts as post}
				<article class="post-card">
					{#if post.featuredImage}
						<a href="/blog/{post.slug}" class="post-image">
							<img src={post.featuredImage} alt={post.title} />
						</a>
					{/if}
					<div class="post-content">
						<div class="post-meta">
							<span class="post-date">{formatDate(post.publishedAt || post.createdAt)}</span>
							{#if post.categories.length > 0}
								<span class="separator">•</span>
								<span class="post-category">{post.categories[0]}</span>
							{/if}
						</div>
						<h2><a href="/blog/{post.slug}">{post.title}</a></h2>
						{#if post.excerpt}
							<p class="post-excerpt">{post.excerpt}</p>
						{/if}
						<a href="/blog/{post.slug}" class="read-more">Read more →</a>
					</div>
				</article>
			{/each}
		</div>
	{/if}
</div>

<style>
	.blog-header {
		text-align: center;
		margin: 3rem 0;
	}
	
	.blog-header h1 {
		font-size: 3rem;
		margin-bottom: 1rem;
	}
	
	.blog-header p {
		font-size: 1.2rem;
		color: #666;
	}
	
	.empty-state {
		text-align: center;
		padding: 4rem 2rem;
		color: #666;
	}
	
	.posts-list {
		max-width: 800px;
		margin: 0 auto;
	}
	
	.post-card {
		margin-bottom: 3rem;
		padding-bottom: 3rem;
		border-bottom: 1px solid var(--border-color);
	}
	
	.post-card:last-child {
		border-bottom: none;
	}
	
	.post-image {
		display: block;
		margin-bottom: 1.5rem;
		overflow: hidden;
		border-radius: 8px;
	}
	
	.post-image img {
		width: 100%;
		height: 400px;
		object-fit: cover;
		transition: transform 0.3s;
	}
	
	.post-image:hover img {
		transform: scale(1.05);
	}
	
	.post-meta {
		font-size: 0.9rem;
		color: #666;
		margin-bottom: 0.75rem;
	}
	
	.separator {
		margin: 0 0.5rem;
	}
	
	.post-category {
		color: var(--primary-color);
	}
	
	.post-content h2 {
		margin-bottom: 1rem;
		font-size: 2rem;
		line-height: 1.3;
	}
	
	.post-content h2 a {
		color: var(--text-color);
		transition: color 0.2s;
	}
	
	.post-content h2 a:hover {
		color: var(--primary-color);
		text-decoration: none;
	}
	
	.post-excerpt {
		font-size: 1.1rem;
		line-height: 1.6;
		color: #555;
		margin-bottom: 1rem;
	}
	
	.read-more {
		font-weight: 500;
		color: var(--primary-color);
		transition: all 0.2s;
	}
	
	.read-more:hover {
		text-decoration: none;
		transform: translateX(5px);
		display: inline-block;
	}
</style>
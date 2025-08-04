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
		<h1 class="blog-title">Blog</h1>
		<p class="blog-subtitle">Thoughts on technology, software development, and life</p>
	</div>
	
	{#if data.posts.length === 0}
		<div class="empty-state">
			<p>No blog posts yet. Check back soon!</p>
		</div>
	{:else}
		<div class="posts-list stagger-animation">
			{#each data.posts as post}
				<article class="post-card hover-lift animate-fadeIn">
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
		margin: 4rem 0 5rem;
		position: relative;
	}
	
	.blog-title {
		font-size: clamp(2.5rem, 5vw, 3.5rem);
		font-weight: 800;
		margin-bottom: 1rem;
		letter-spacing: -0.03em;
		background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}
	
	.blog-subtitle {
		font-size: 1.25rem;
		color: var(--text-light);
		font-weight: 400;
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
		margin-bottom: 4rem;
		padding: 2.5rem;
		background: white;
		border-radius: var(--radius-xl);
		box-shadow: var(--shadow-sm);
		transition: all 0.3s ease;
		border: 1px solid var(--border-color);
		position: relative;
		overflow: hidden;
	}
	
	.post-card::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		width: 4px;
		height: 100%;
		background: linear-gradient(180deg, var(--primary-color), var(--primary-light));
		transform: translateX(-100%);
		transition: transform 0.3s ease;
	}
	
	.post-card:hover {
		transform: translateY(-4px);
		box-shadow: var(--shadow-lg);
		border-color: transparent;
	}
	
	.post-card:hover::before {
		transform: translateX(0);
	}
	
	.post-image {
		display: block;
		margin: -2.5rem -2.5rem 2rem;
		overflow: hidden;
		border-radius: var(--radius-xl) var(--radius-xl) 0 0;
		position: relative;
	}
	
	.post-image::after {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(to bottom, transparent 60%, rgba(0, 0, 0, 0.1));
		opacity: 0;
		transition: opacity 0.3s ease;
	}
	
	.post-image:hover::after {
		opacity: 1;
	}
	
	.post-image img {
		width: 100%;
		height: 350px;
		object-fit: cover;
		transition: transform 0.6s ease;
	}
	
	.post-image:hover img {
		transform: scale(1.08);
	}
	
	.post-meta {
		font-size: 0.875rem;
		color: var(--text-light);
		margin-bottom: 1rem;
		font-weight: 500;
		display: flex;
		align-items: center;
		gap: 0.75rem;
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
	
	.post-content h2 {
		margin-bottom: 1.25rem;
		font-size: 1.875rem;
		line-height: 1.3;
		font-weight: 700;
		letter-spacing: -0.025em;
	}
	
	.post-content h2 a {
		color: var(--text-color);
		transition: all 0.3s ease;
		background-image: linear-gradient(to right, var(--primary-color), var(--primary-color));
		background-position: 0 100%;
		background-repeat: no-repeat;
		background-size: 0 3px;
	}
	
	.post-content h2 a:hover {
		color: var(--primary-color);
		text-decoration: none;
		background-size: 100% 3px;
	}
	
	.post-excerpt {
		font-size: 1.05rem;
		line-height: 1.7;
		color: var(--text-light);
		margin-bottom: 1.5rem;
	}
	
	.read-more {
		font-weight: 600;
		color: var(--primary-color);
		font-size: 0.9rem;
		transition: all 0.3s ease;
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
	}
	
	.read-more::after {
		content: '→';
		transition: transform 0.3s ease;
		font-size: 1.1rem;
	}
	
	.read-more:hover {
		text-decoration: none;
		gap: 0.75rem;
	}
	
	.read-more:hover::after {
		transform: translateX(4px);
	}
	@media (max-width: 768px) {
		.post-card {
			padding: 1.5rem;
		}
		
		.post-image {
			margin: -1.5rem -1.5rem 1.5rem;
		}
		
		.post-content h2 {
			font-size: 1.5rem;
		}
	}
</style>
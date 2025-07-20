<script lang="ts">
	import type { PageData } from './$types';
	
	export let data: PageData;
	$: recentPosts = data.recentPosts || [];
	
	function formatDate(date: Date | string) {
		return new Date(date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>Alex Hopmann - Tech Blog</title>
	<meta name="description" content="Personal tech blog covering software development, travel, and technology" />
</svelte:head>

<div class="hero">
	<div class="container">
		<h1>Alex Hopmann</h1>
		<p class="tagline">Technology, Software Development, and Life</p>
	</div>
</div>

<div class="container">
	<section class="recent-posts">
		<h2>Recent Posts</h2>
		{#if recentPosts.length === 0}
			<p class="no-posts">No posts yet. Check back soon!</p>
		{:else}
			<div class="posts-grid">
				{#each recentPosts as post}
					<article class="post-card">
						<div class="post-meta">
							{formatDate(post.publishedAt || post.createdAt)}
							{#if post.categories.length > 0}
								• {post.categories[0]}
							{/if}
						</div>
						<h3><a href="/blog/{post.slug}">{post.title}</a></h3>
						{#if post.excerpt}
							<p>{post.excerpt}</p>
						{/if}
						<a href="/blog/{post.slug}" class="read-more">Read more →</a>
					</article>
				{/each}
			</div>
			<div class="view-all">
				<a href="/blog" class="button">View All Posts</a>
			</div>
		{/if}
	</section>
	
	<section class="about">
		<h2>About</h2>
		<p>
			Welcome to my personal blog where I share thoughts on technology, software development,
			and various life experiences. I write about programming, travel, music, and whatever
			else captures my interest.
		</p>
	</section>
</div>

<style>
	.hero {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		padding: 4rem 0;
		margin-bottom: 3rem;
	}
	
	.hero h1 {
		font-size: 3rem;
		margin-bottom: 0.5rem;
	}
	
	.tagline {
		font-size: 1.25rem;
		opacity: 0.9;
	}
	
	section {
		margin-bottom: 4rem;
	}
	
	h2 {
		font-size: 2rem;
		margin-bottom: 2rem;
		color: var(--text-color);
	}
	
	.no-posts {
		text-align: center;
		color: #666;
		padding: 2rem;
	}
	
	.posts-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 2rem;
		margin-bottom: 2rem;
	}
	
	.post-card {
		padding: 1.5rem;
		background: white;
		border-radius: 8px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		transition: transform 0.2s, box-shadow 0.2s;
	}
	
	.post-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
	}
	
	.post-meta {
		font-size: 0.85rem;
		color: #666;
		margin-bottom: 0.5rem;
	}
	
	.post-card h3 {
		margin-bottom: 0.75rem;
		font-size: 1.25rem;
		line-height: 1.4;
	}
	
	.post-card h3 a {
		color: var(--text-color);
		transition: color 0.2s;
	}
	
	.post-card h3 a:hover {
		color: var(--primary-color);
		text-decoration: none;
	}
	
	.post-card p {
		color: #555;
		line-height: 1.6;
		margin-bottom: 1rem;
	}
	
	.read-more {
		color: var(--primary-color);
		font-weight: 500;
		transition: transform 0.2s;
		display: inline-block;
	}
	
	.read-more:hover {
		text-decoration: none;
		transform: translateX(5px);
	}
	
	.view-all {
		text-align: center;
		margin-top: 2rem;
	}
	
	.button {
		display: inline-block;
		padding: 0.75rem 2rem;
		background: var(--primary-color);
		color: white;
		border-radius: 4px;
		font-weight: 500;
		transition: transform 0.2s, box-shadow 0.2s;
	}
	
	.button:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
		text-decoration: none;
	}
	
	.about {
		max-width: 800px;
		margin: 0 auto;
		text-align: center;
	}
	
	.about p {
		font-size: 1.1rem;
		line-height: 1.8;
		color: #555;
	}
</style>
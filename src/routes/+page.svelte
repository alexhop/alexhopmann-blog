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
	<div class="hero-background"></div>
	<div class="container">
		<div class="hero-content">
			<h1 class="hero-title">Alex Hopmann</h1>
			<p class="hero-tagline">Technology, Software Development, and Life</p>
			<div class="hero-cta">
				<a href="/blog" class="btn-primary">Read My Blog</a>
				<a href="#about" class="btn-secondary">Learn More</a>
			</div>
		</div>
	</div>
</div>

<div class="container">
	<section class="recent-posts">
		<h2>Recent Posts</h2>
		{#if recentPosts.length === 0}
			<p class="no-posts">No posts yet. Check back soon!</p>
		{:else}
			<div class="posts-grid stagger-animation">
				{#each recentPosts as post}
					<article class="post-card hover-lift">
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
	
	<section id="about" class="about">
		<div class="about-content">
			<h2>About Me</h2>
			<p class="about-text">
				Welcome to my personal blog where I share thoughts on technology, software development,
				and various life experiences. I write about programming, travel, music, and whatever
				else captures my interest.
			</p>
			<div class="about-stats">
				<div class="stat">
					<span class="stat-number">106</span>
					<span class="stat-label">Blog Posts</span>
				</div>
				<div class="stat">
					<span class="stat-number">18+</span>
					<span class="stat-label">Years Writing</span>
				</div>
				<div class="stat">
					<span class="stat-number">∞</span>
					<span class="stat-label">Ideas to Share</span>
				</div>
			</div>
		</div>
	</section>
</div>

<style>
	.hero {
		position: relative;
		color: white;
		padding: 8rem 0 6rem;
		margin-bottom: 4rem;
		overflow: hidden;
	}
	
	.hero-background {
		position: absolute;
		inset: 0;
		background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%);
		opacity: 0.95;
	}
	
	.hero-background::before {
		content: '';
		position: absolute;
		inset: 0;
		background-image: 
			radial-gradient(circle at 20% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
			radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
			radial-gradient(circle at 40% 40%, rgba(255, 255, 255, 0.05) 0%, transparent 50%);
	}
	
	.hero-content {
		position: relative;
		z-index: 1;
		text-align: center;
		max-width: 800px;
		margin: 0 auto;
	}
	
	.hero-title {
		font-size: clamp(2.5rem, 5vw, 4rem);
		font-weight: 800;
		margin-bottom: 1rem;
		letter-spacing: -0.03em;
		line-height: 1.1;
	}
	
	.hero-tagline {
		font-size: clamp(1.125rem, 2vw, 1.5rem);
		opacity: 0.9;
		font-weight: 400;
		margin-bottom: 2.5rem;
	}
	
	.hero-cta {
		display: flex;
		gap: 1rem;
		justify-content: center;
		flex-wrap: wrap;
	}
	
	.btn-primary, .btn-secondary {
		padding: 0.875rem 2rem;
		border-radius: var(--radius-lg);
		font-weight: 600;
		font-size: 1rem;
		transition: all 0.3s ease;
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
	}
	
	.btn-primary {
		background: white;
		color: var(--primary-color);
		box-shadow: var(--shadow-lg);
	}
	
	.btn-primary:hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow-xl);
		text-decoration: none;
	}
	
	.btn-secondary {
		background: rgba(255, 255, 255, 0.1);
		color: white;
		border: 2px solid rgba(255, 255, 255, 0.3);
		backdrop-filter: blur(10px);
	}
	
	.btn-secondary:hover {
		background: rgba(255, 255, 255, 0.2);
		border-color: rgba(255, 255, 255, 0.5);
		transform: translateY(-2px);
		text-decoration: none;
	}
	
	section {
		margin-bottom: 6rem;
	}
	
	h2 {
		font-size: 2.5rem;
		font-weight: 700;
		margin-bottom: 3rem;
		color: var(--text-color);
		letter-spacing: -0.025em;
		position: relative;
		text-align: center;
	}
	
	.recent-posts h2::after {
		content: '';
		position: absolute;
		bottom: -0.75rem;
		left: 50%;
		transform: translateX(-50%);
		width: 60px;
		height: 4px;
		background: var(--primary-color);
		border-radius: 2px;
	}
	
	.no-posts {
		text-align: center;
		color: #666;
		padding: 2rem;
	}
	
	.posts-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
		gap: 2rem;
		margin-bottom: 3rem;
	}
	
	.post-card {
		padding: 2rem;
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
		right: 0;
		height: 4px;
		background: linear-gradient(90deg, var(--primary-color), var(--primary-light));
		transform: translateY(-100%);
		transition: transform 0.3s ease;
	}
	
	.post-card:hover {
		transform: translateY(-4px);
		box-shadow: var(--shadow-lg);
		border-color: transparent;
	}
	
	.post-card:hover::before {
		transform: translateY(0);
	}
	
	.post-meta {
		font-size: 0.875rem;
		color: var(--text-light);
		margin-bottom: 0.75rem;
		font-weight: 500;
		letter-spacing: 0.025em;
		text-transform: uppercase;
	}
	
	.post-card h3 {
		margin-bottom: 1rem;
		font-size: 1.375rem;
		line-height: 1.3;
		font-weight: 700;
		letter-spacing: -0.025em;
	}
	
	.post-card h3 a {
		color: var(--text-color);
		transition: color 0.2s;
		background-image: linear-gradient(to right, var(--primary-color), var(--primary-color));
		background-position: 0 100%;
		background-repeat: no-repeat;
		background-size: 0 2px;
		transition: background-size 0.3s ease;
	}
	
	.post-card:hover h3 a {
		color: var(--primary-color);
		background-size: 100% 2px;
	}
	
	.post-card p {
		color: var(--text-light);
		line-height: 1.7;
		margin-bottom: 1.5rem;
		font-size: 0.95rem;
	}
	
	.read-more {
		color: var(--primary-color);
		font-weight: 600;
		font-size: 0.875rem;
		transition: all 0.2s ease;
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
	}
	
	.read-more::after {
		content: '→';
		transition: transform 0.2s ease;
	}
	
	.read-more:hover {
		text-decoration: none;
		gap: 0.5rem;
	}
	
	.read-more:hover::after {
		transform: translateX(4px);
	}
	
	.view-all {
		text-align: center;
		margin-top: 3rem;
	}
	
	.button {
		display: inline-block;
		padding: 1rem 2.5rem;
		background: var(--primary-color);
		color: white;
		border-radius: var(--radius-lg);
		font-weight: 600;
		font-size: 1rem;
		transition: all 0.3s ease;
		position: relative;
		overflow: hidden;
	}
	
	.button::before {
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
	
	.button:hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow-lg);
		text-decoration: none;
		background: var(--primary-dark);
	}
	
	.button:hover::before {
		width: 300px;
		height: 300px;
	}
	
	.about {
		background: var(--background-gray);
		padding: 5rem 0;
		margin: 6rem -24px 0;
		position: relative;
	}
	
	.about::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 1px;
		background: linear-gradient(90deg, transparent, var(--border-color), transparent);
	}
	
	.about-content {
		max-width: 800px;
		margin: 0 auto;
		text-align: center;
		padding: 0 24px;
	}
	
	.about h2::after {
		content: '';
		position: absolute;
		bottom: -0.75rem;
		left: 50%;
		transform: translateX(-50%);
		width: 60px;
		height: 4px;
		background: var(--secondary-color);
		border-radius: 2px;
	}
	
	.about-text {
		font-size: 1.125rem;
		line-height: 1.8;
		color: var(--text-light);
		margin-bottom: 3rem;
	}
	
	.about-stats {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 2rem;
		max-width: 500px;
		margin: 0 auto;
	}
	
	.stat {
		text-align: center;
	}
	
	.stat-number {
		display: block;
		font-size: 2.5rem;
		font-weight: 800;
		color: var(--primary-color);
		margin-bottom: 0.5rem;
		letter-spacing: -0.025em;
	}
	
	.stat-label {
		display: block;
		font-size: 0.875rem;
		color: var(--text-light);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		font-weight: 600;
	}
	@media (max-width: 768px) {
		.hero {
			padding: 5rem 0 4rem;
		}
		
		.hero-cta {
			justify-content: center;
			width: 100%;
		}
		
		.btn-primary, .btn-secondary {
			font-size: 0.9rem;
			padding: 0.75rem 1.5rem;
		}
		
		.posts-grid {
			grid-template-columns: 1fr;
		}
		
		.about {
			margin-left: -16px;
			margin-right: -16px;
		}
	}
</style>
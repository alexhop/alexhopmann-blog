<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';
	import type { PageData } from './$types';
	
	export let data: PageData;
	
	$: sidebarPages = data.sidebarPages || [];
	$: showSidebar = sidebarPages.length > 0 && !$page.url.pathname.startsWith('/admin');
</script>

<nav class="main-nav">
	<div class="container">
		<a href="/" class="logo">Alex Hopmann</a>
		<div class="nav-links">
			<a href="/" class:active={$page.url.pathname === '/'}>Home</a>
			<a href="/blog" class:active={$page.url.pathname.startsWith('/blog')}>Blog</a>
			<a href="/admin" class:active={$page.url.pathname.startsWith('/admin')}>Admin</a>
		</div>
	</div>
</nav>

<div class="content-wrapper" class:with-sidebar={showSidebar}>
	{#if showSidebar}
		<aside class="sidebar">
			<nav class="sidebar-nav">
				<h3>Pages</h3>
				<ul>
					{#each sidebarPages as sidebarPage}
						<li>
							<a 
								href="/page/{sidebarPage.slug}" 
								class:active={$page.url.pathname === `/page/${sidebarPage.slug}`}
							>
								{sidebarPage.title}
							</a>
						</li>
					{/each}
				</ul>
			</nav>
		</aside>
	{/if}
	
	<main class="page-transition">
		<slot />
	</main>
</div>

<footer>
	<div class="container">
		<p>&copy; {new Date().getFullYear()} Alex Hopmann. All rights reserved.</p>
	</div>
</footer>

<style>
	.main-nav {
		background: rgba(255, 255, 255, 0.98);
		backdrop-filter: blur(10px);
		border-bottom: 1px solid var(--border-color);
		position: sticky;
		top: 0;
		z-index: 100;
		transition: all 0.3s ease;
	}
	
	.main-nav .container {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.25rem 24px;
	}
	
	.logo {
		font-weight: 700;
		font-size: 1.375rem;
		color: var(--text-color);
		letter-spacing: -0.025em;
		transition: all 0.2s ease;
	}
	
	.logo:hover {
		text-decoration: none;
		color: var(--primary-color);
		transform: translateY(-1px);
	}
	
	.nav-links {
		display: flex;
		gap: 2.5rem;
		align-items: center;
	}
	
	.nav-links a {
		color: var(--text-light);
		font-weight: 500;
		font-size: 0.95rem;
		position: relative;
		transition: all 0.2s ease;
		padding: 0.5rem 0;
	}
	
	.nav-links a:hover {
		color: var(--text-color);
		text-decoration: none;
	}
	
	.nav-links a.active {
		color: var(--primary-color);
		font-weight: 600;
	}
	
	.nav-links a::before {
		content: '';
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: 2px;
		background: var(--primary-color);
		transform: scaleX(0);
		transition: transform 0.3s ease;
		transform-origin: center;
	}
	
	.nav-links a.active::before,
	.nav-links a:hover::before {
		transform: scaleX(1);
	}
	
	.content-wrapper {
		display: flex;
		max-width: 1400px;
		margin: 0 auto;
		padding: 0 1rem;
		gap: 2rem;
	}
	
	.content-wrapper.with-sidebar {
		padding-top: 2rem;
	}
	
	.sidebar {
		width: 250px;
		flex-shrink: 0;
		position: sticky;
		top: 80px;
		height: fit-content;
	}
	
	.sidebar-nav {
		background: white;
		border-radius: 8px;
		padding: 1.5rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
		border: 1px solid var(--border-color);
	}
	
	.sidebar-nav h3 {
		font-size: 0.875rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-secondary);
		margin-bottom: 1rem;
		font-weight: 600;
	}
	
	.sidebar-nav ul {
		list-style: none;
		padding: 0;
		margin: 0;
	}
	
	.sidebar-nav li {
		margin-bottom: 0.5rem;
	}
	
	.sidebar-nav a {
		display: block;
		padding: 0.5rem 0.75rem;
		color: var(--text-color);
		text-decoration: none;
		border-radius: 4px;
		transition: all 0.2s ease;
		font-size: 0.95rem;
	}
	
	.sidebar-nav a:hover {
		background: var(--background-gray);
		color: var(--primary-color);
		transform: translateX(4px);
	}
	
	.sidebar-nav a.active {
		background: var(--primary-color);
		color: white;
		font-weight: 500;
	}
	
	main {
		min-height: calc(100vh - 140px);
		flex: 1;
		max-width: 100%;
	}
	
	footer {
		background: var(--background-gray);
		padding: 3rem 0;
		margin-top: 6rem;
		border-top: 1px solid var(--border-color);
	}
	
	footer .container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}
	
	footer p {
		text-align: center;
		color: var(--text-light);
		font-size: 0.875rem;
		margin: 0;
	}
	
	@media (max-width: 1024px) {
		.sidebar {
			width: 200px;
		}
	}
	
	@media (max-width: 768px) {
		.nav-links {
			gap: 1.5rem;
		}
		
		.nav-links a {
			font-size: 0.9rem;
		}
		
		.logo {
			font-size: 1.25rem;
		}
		
		.content-wrapper {
			flex-direction: column;
		}
		
		.sidebar {
			width: 100%;
			position: static;
		}
		
		.sidebar-nav {
			margin-bottom: 2rem;
		}
	}
</style>
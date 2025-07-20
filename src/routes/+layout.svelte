<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';
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

<main>
	<slot />
</main>

<footer>
	<div class="container">
		<p>&copy; {new Date().getFullYear()} Alex Hopmann. All rights reserved.</p>
	</div>
</footer>

<style>
	.main-nav {
		background: white;
		border-bottom: 1px solid var(--border-color);
		position: sticky;
		top: 0;
		z-index: 100;
	}
	
	.main-nav .container {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 20px;
	}
	
	.logo {
		font-weight: 600;
		font-size: 1.25rem;
		color: var(--text-color);
	}
	
	.logo:hover {
		text-decoration: none;
		color: var(--primary-color);
	}
	
	.nav-links {
		display: flex;
		gap: 2rem;
	}
	
	.nav-links a {
		color: var(--text-color);
		font-weight: 500;
		position: relative;
	}
	
	.nav-links a:hover {
		color: var(--primary-color);
		text-decoration: none;
	}
	
	.nav-links a.active {
		color: var(--primary-color);
	}
	
	.nav-links a.active::after {
		content: '';
		position: absolute;
		bottom: -0.5rem;
		left: 0;
		right: 0;
		height: 2px;
		background: var(--primary-color);
	}
	
	main {
		min-height: calc(100vh - 120px);
	}
	
	footer {
		background: #f5f5f5;
		padding: 2rem 0;
		margin-top: 4rem;
		border-top: 1px solid var(--border-color);
	}
	
	footer p {
		text-align: center;
		color: #666;
		margin: 0;
	}
</style>
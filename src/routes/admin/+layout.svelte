<script lang="ts">
	import AdminDebugFooter from '$lib/components/AdminDebugFooter.svelte';
	
	export let data;
</script>

<div class="admin-layout">
	<header class="admin-header">
		<div class="container">
			<nav>
				<a href="/admin" class="logo">Admin Dashboard</a>
				<div class="nav-links">
					<a href="/admin/posts">Posts</a>
					<a href="/admin/pages">Pages</a>
					<a href="/admin/media">Media</a>
					<a href="/admin/comments">Comments</a>
					<a href="/admin/users">Users</a>
				</div>
				<div class="user-info">
					<span>Welcome, {data.user.name}</span>
					<form method="POST" action="/auth/logout">
						<button type="submit">Logout</button>
					</form>
				</div>
			</nav>
		</div>
	</header>
	
	<main class="admin-main">
		<div class="container">
			<slot />
		</div>
	</main>
</div>

<AdminDebugFooter />

<style>
	.admin-layout {
		min-height: 100vh;
		background: #f5f5f5;
	}
	
	.admin-header {
		background: white;
		border-bottom: 1px solid var(--border-color);
		padding: 1rem 0;
	}
	
	nav {
		display: flex;
		align-items: center;
		gap: 2rem;
	}
	
	.logo {
		font-weight: 600;
		font-size: 1.2rem;
	}
	
	.nav-links {
		display: flex;
		gap: 1.5rem;
		flex: 1;
	}
	
	.nav-links a {
		color: var(--text-color);
		font-weight: 500;
	}
	
	.nav-links a:hover {
		color: var(--primary-color);
	}
	
	.user-info {
		display: flex;
		align-items: center;
		gap: 1rem;
	}
	
	.user-info button {
		background: none;
		border: 1px solid var(--border-color);
		padding: 0.5rem 1rem;
		border-radius: 4px;
		cursor: pointer;
		transition: all 0.2s;
	}
	
	.user-info button:hover {
		background: var(--error-color);
		color: white;
		border-color: var(--error-color);
	}
	
	.admin-main {
		padding: 2rem 0;
	}
</style>
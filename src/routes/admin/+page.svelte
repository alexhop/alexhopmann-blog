<script lang="ts">
	export let data;
</script>

<svelte:head>
	<title>Admin Dashboard - Alex Hopmann</title>
</svelte:head>

<div class="dashboard">
	<h1>Dashboard</h1>
	
	<div class="stats-grid">
		<div class="stat-card">
			<h3>Total Posts</h3>
			<p class="stat-number">0</p>
		</div>
		<div class="stat-card">
			<h3>Total Views</h3>
			<p class="stat-number">0</p>
		</div>
		<div class="stat-card">
			<h3>Comments</h3>
			<p class="stat-number">0</p>
		</div>
		<div class="stat-card">
			<h3>Media Files</h3>
			<p class="stat-number">0</p>
		</div>
	</div>
	
	<div class="quick-actions">
		<h2>Quick Actions</h2>
		<div class="action-buttons">
			<a href="/admin/posts/new" class="action-button primary">
				Create New Post
			</a>
			<a href="/admin/media" class="action-button">
				Upload Media
			</a>
		</div>
	</div>
</div>

<style>
	.dashboard {
		max-width: 1200px;
		margin: 0 auto;
	}
	
	h1 {
		margin-bottom: 2rem;
	}
	
	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1.5rem;
		margin-bottom: 3rem;
	}
	
	.stat-card {
		background: white;
		padding: 1.5rem;
		border-radius: 8px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}
	
	.stat-card h3 {
		font-size: 0.9rem;
		color: #666;
		margin-bottom: 0.5rem;
	}
	
	.stat-number {
		font-size: 2rem;
		font-weight: 600;
		color: var(--primary-color);
	}
	
	.quick-actions {
		background: white;
		padding: 2rem;
		border-radius: 8px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}
	
	.quick-actions h2 {
		margin-bottom: 1.5rem;
	}
	
	.action-buttons {
		display: flex;
		gap: 1rem;
	}
	
	.action-button {
		padding: 0.75rem 1.5rem;
		border-radius: 4px;
		font-weight: 500;
		border: 1px solid var(--border-color);
		transition: all 0.2s;
	}
	
	.action-button:hover {
		transform: translateY(-1px);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}
	
	.action-button.primary {
		background: var(--primary-color);
		color: white;
		border-color: var(--primary-color);
	}
</style>
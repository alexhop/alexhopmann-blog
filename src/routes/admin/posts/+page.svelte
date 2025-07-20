<script lang="ts">
	export let data;
	
	function formatDate(date: Date | string) {
		return new Date(date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>Manage Posts - Admin</title>
</svelte:head>

<div class="posts-page">
	<div class="page-header">
		<h1>Posts</h1>
		<a href="/admin/posts/new" class="button primary">Create New Post</a>
	</div>
	
	{#if data.posts.length === 0}
		<div class="empty-state">
			<p>No posts yet. Create your first post!</p>
			<a href="/admin/posts/new" class="button primary">Create Post</a>
		</div>
	{:else}
		<div class="posts-table">
			<table>
				<thead>
					<tr>
						<th>Title</th>
						<th>Author</th>
						<th>Status</th>
						<th>Date</th>
						<th>Views</th>
						<th>Actions</th>
					</tr>
				</thead>
				<tbody>
					{#each data.posts as post}
						<tr>
							<td>
								<a href="/admin/posts/{post.slug}/edit">{post.title}</a>
							</td>
							<td>{post.author.name}</td>
							<td>
								<span class="status status-{post.status}">
									{post.status}
								</span>
							</td>
							<td>{formatDate(post.publishedAt || post.createdAt)}</td>
							<td>{post.views}</td>
							<td>
								<div class="actions">
									<a href="/admin/posts/{post.slug}/edit" class="action-link">Edit</a>
									<a href="/blog/{post.slug}" target="_blank" class="action-link">View</a>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>

<style>
	.posts-page {
		background: white;
		padding: 2rem;
		border-radius: 8px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}
	
	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
	}
	
	.button {
		padding: 0.75rem 1.5rem;
		border-radius: 4px;
		font-weight: 500;
		border: 1px solid var(--border-color);
		background: white;
		color: var(--text-color);
		text-decoration: none;
		display: inline-block;
		transition: all 0.2s;
	}
	
	.button.primary {
		background: var(--primary-color);
		color: white;
		border-color: var(--primary-color);
	}
	
	.button:hover {
		transform: translateY(-1px);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}
	
	.empty-state {
		text-align: center;
		padding: 4rem 2rem;
	}
	
	.empty-state p {
		margin-bottom: 1rem;
		color: #666;
	}
	
	table {
		width: 100%;
		border-collapse: collapse;
	}
	
	th {
		text-align: left;
		padding: 0.75rem;
		border-bottom: 2px solid var(--border-color);
		font-weight: 600;
		color: #666;
	}
	
	td {
		padding: 0.75rem;
		border-bottom: 1px solid var(--border-color);
	}
	
	tr:hover {
		background: #f9f9f9;
	}
	
	.status {
		padding: 0.25rem 0.75rem;
		border-radius: 4px;
		font-size: 0.85rem;
		font-weight: 500;
	}
	
	.status-published {
		background: #e8f5e9;
		color: #2e7d32;
	}
	
	.status-draft {
		background: #fff3e0;
		color: #f57c00;
	}
	
	.actions {
		display: flex;
		gap: 1rem;
	}
	
	.action-link {
		color: var(--primary-color);
		font-size: 0.9rem;
	}
</style>
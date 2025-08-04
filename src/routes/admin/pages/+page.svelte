<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	
	interface Page {
		id: string;
		slug: string;
		title: string;
		status: 'draft' | 'published';
		showInSidebar: boolean;
		order?: number;
		createdAt: string;
		updatedAt: string;
	}
	
	let pages: Page[] = [];
	let loading = true;
	let error = '';
	
	onMount(async () => {
		await fetchPages();
	});
	
	async function fetchPages() {
		try {
			const response = await fetch('/api/pages');
			if (response.ok) {
				pages = await response.json();
			} else {
				error = 'Failed to fetch pages';
			}
		} catch (err) {
			error = 'Error loading pages';
		} finally {
			loading = false;
		}
	}
	
	async function deletePage(slug: string, title: string) {
		if (!confirm(`Are you sure you want to delete "${title}"?`)) {
			return;
		}
		
		try {
			const response = await fetch(`/api/pages/${slug}`, {
				method: 'DELETE'
			});
			
			if (response.ok) {
				pages = pages.filter(p => p.slug !== slug);
			} else {
				const data = await response.json();
				alert(`Failed to delete page: ${data.error}`);
			}
		} catch (err) {
			alert('Error deleting page');
		}
	}
	
	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString();
	}
</script>

<div class="pages-admin">
	<div class="header">
		<h1>Pages</h1>
		<a href="/admin/pages/new" class="btn btn-primary">Create New Page</a>
	</div>
	
	{#if loading}
		<div class="loading">Loading pages...</div>
	{:else if error}
		<div class="error">{error}</div>
	{:else if pages.length === 0}
		<div class="empty">
			<p>No pages yet.</p>
			<a href="/admin/pages/new" class="btn btn-primary">Create Your First Page</a>
		</div>
	{:else}
		<div class="pages-table">
			<table>
				<thead>
					<tr>
						<th>Title</th>
						<th>Slug</th>
						<th>Status</th>
						<th>Sidebar</th>
						<th>Order</th>
						<th>Created</th>
						<th>Actions</th>
					</tr>
				</thead>
				<tbody>
					{#each pages as page}
						<tr>
							<td>
								<a href="/page/{page.slug}" target="_blank" class="page-title">
									{page.title}
								</a>
							</td>
							<td class="slug">{page.slug}</td>
							<td>
								<span class="status status-{page.status}">
									{page.status}
								</span>
							</td>
							<td>
								{#if page.showInSidebar}
									<span class="badge">Yes</span>
								{:else}
									<span class="badge badge-secondary">No</span>
								{/if}
							</td>
							<td>{page.order || '-'}</td>
							<td>{formatDate(page.createdAt)}</td>
							<td class="actions">
								<a href="/admin/pages/{page.slug}/edit" class="btn btn-sm">Edit</a>
								<button 
									on:click={() => deletePage(page.slug, page.title)}
									class="btn btn-sm btn-danger"
								>
									Delete
								</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>

<style>
	.pages-admin {
		max-width: 1200px;
		margin: 0 auto;
	}
	
	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
	}
	
	h1 {
		font-size: 2rem;
		margin: 0;
	}
	
	.loading, .error, .empty {
		text-align: center;
		padding: 2rem;
		background: white;
		border-radius: 8px;
		border: 1px solid var(--border-color);
	}
	
	.error {
		color: var(--error-color);
	}
	
	.empty p {
		margin-bottom: 1rem;
		color: var(--text-secondary);
	}
	
	.pages-table {
		background: white;
		border-radius: 8px;
		overflow: hidden;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}
	
	table {
		width: 100%;
		border-collapse: collapse;
	}
	
	th {
		text-align: left;
		padding: 1rem;
		background: #f8f9fa;
		font-weight: 600;
		color: var(--text-secondary);
		font-size: 0.875rem;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}
	
	td {
		padding: 1rem;
		border-top: 1px solid var(--border-color);
	}
	
	.page-title {
		font-weight: 500;
		color: var(--text-color);
		text-decoration: none;
	}
	
	.page-title:hover {
		color: var(--primary-color);
	}
	
	.slug {
		font-family: monospace;
		font-size: 0.875rem;
		color: var(--text-secondary);
	}
	
	.status {
		display: inline-block;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
	}
	
	.status-published {
		background: #d4edda;
		color: #155724;
	}
	
	.status-draft {
		background: #fff3cd;
		color: #856404;
	}
	
	.badge {
		display: inline-block;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: 600;
		background: var(--primary-color);
		color: white;
	}
	
	.badge-secondary {
		background: #e9ecef;
		color: #495057;
	}
	
	.actions {
		display: flex;
		gap: 0.5rem;
	}
	
	.btn {
		display: inline-block;
		padding: 0.5rem 1rem;
		background: var(--primary-color);
		color: white;
		text-decoration: none;
		border-radius: 4px;
		border: none;
		cursor: pointer;
		font-size: 0.875rem;
		font-weight: 500;
		transition: background 0.2s;
	}
	
	.btn:hover {
		background: var(--primary-hover);
	}
	
	.btn-sm {
		padding: 0.375rem 0.75rem;
		font-size: 0.8125rem;
	}
	
	.btn-danger {
		background: var(--error-color);
	}
	
	.btn-danger:hover {
		background: #c82333;
	}
	
	.btn-primary {
		background: var(--primary-color);
	}
	
	@media (max-width: 768px) {
		.pages-table {
			overflow-x: auto;
		}
		
		table {
			min-width: 600px;
		}
	}
</style>
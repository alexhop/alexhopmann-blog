<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import RichTextEditor from '$lib/components/RichTextEditor.svelte';
	import DebugError from '$lib/components/DebugError.svelte';
	
	let pageData: any = null;
	let title = '';
	let slug = '';
	let content = '';
	let excerpt = '';
	let status: 'draft' | 'published' = 'draft';
	let showInSidebar = false;
	let order = 0;
	let metaDescription = '';
	let loading = true;
	let saving = false;
	let error = '';
	let debugError: any = null;
	
	$: currentSlug = $page.params.slug;
	
	onMount(async () => {
		await loadPage();
	});
	
	async function loadPage() {
		try {
			const response = await fetch(`/api/pages/${currentSlug}`);
			if (response.ok) {
				pageData = await response.json();
				title = pageData.title;
				slug = pageData.slug;
				content = pageData.content;
				excerpt = pageData.excerpt || '';
				status = pageData.status;
				showInSidebar = pageData.showInSidebar || false;
				order = pageData.order || 0;
				metaDescription = pageData.metaDescription || '';
			} else {
				error = 'Failed to load page';
			}
		} catch (err) {
			error = 'Error loading page';
			debugError = err;
		} finally {
			loading = false;
		}
	}
	
	async function savePage() {
		if (!title || !content || !slug) {
			error = 'Please fill in all required fields';
			return;
		}
		
		saving = true;
		error = '';
		debugError = null;
		
		try {
			const response = await fetch(`/api/pages/${currentSlug}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					title,
					slug,
					content,
					excerpt,
					status,
					showInSidebar,
					order,
					metaDescription
				})
			});
			
			if (response.ok) {
				const updatedPage = await response.json();
				// If slug changed, redirect to new URL
				if (updatedPage.slug !== currentSlug) {
					goto(`/admin/pages/${updatedPage.slug}/edit`);
				} else {
					// Reload to show saved state
					await loadPage();
				}
			} else {
				const data = await response.json();
				error = data.error || 'Failed to save page';
				debugError = data;
			}
		} catch (err) {
			error = 'Error saving page';
			debugError = err;
		} finally {
			saving = false;
		}
	}
	
	async function deletePage() {
		if (!confirm(`Are you sure you want to delete "${title}"?`)) {
			return;
		}
		
		try {
			const response = await fetch(`/api/pages/${currentSlug}`, {
				method: 'DELETE'
			});
			
			if (response.ok) {
				goto('/admin/pages');
			} else {
				const data = await response.json();
				error = `Failed to delete page: ${data.error}`;
				debugError = data;
			}
		} catch (err) {
			error = 'Error deleting page';
			debugError = err;
		}
	}
	
	function cancel() {
		goto('/admin/pages');
	}
</script>

<div class="page-editor">
	{#if loading}
		<div class="loading">Loading page...</div>
	{:else}
		<div class="header">
			<h1>Edit Page</h1>
			<div class="actions">
				<button on:click={cancel} class="btn btn-secondary">Cancel</button>
				<button on:click={deletePage} class="btn btn-danger">Delete</button>
				<button on:click={savePage} class="btn btn-primary" disabled={saving}>
					{saving ? 'Saving...' : 'Save Page'}
				</button>
			</div>
		</div>
		
		{#if error}
			<div class="error-message">{error}</div>
		{/if}
		
		<DebugError error={debugError} title="Debug Information - Page Error" />
		
		<div class="editor-form">
			<div class="form-group">
				<label for="title">Title *</label>
				<input
					id="title"
					type="text"
					bind:value={title}
					placeholder="Page title"
					class="form-control"
				/>
			</div>
			
			<div class="form-group">
				<label for="slug">URL Slug *</label>
				<input
					id="slug"
					type="text"
					bind:value={slug}
					placeholder="url-slug"
					class="form-control"
				/>
				<small>This will be the URL: /page/{slug || 'url-slug'}</small>
			</div>
			
			<div class="form-group">
				<label for="excerpt">Excerpt</label>
				<textarea
					id="excerpt"
					bind:value={excerpt}
					placeholder="Brief description of the page"
					class="form-control"
					rows="3"
				></textarea>
			</div>
			
			<div class="form-group">
				<label for="metaDescription">Meta Description</label>
				<textarea
					id="metaDescription"
					bind:value={metaDescription}
					placeholder="SEO meta description"
					class="form-control"
					rows="2"
				></textarea>
			</div>
			
			<div class="form-row">
				<div class="form-group">
					<label for="status">Status</label>
					<select id="status" bind:value={status} class="form-control">
						<option value="draft">Draft</option>
						<option value="published">Published</option>
					</select>
				</div>
				
				<div class="form-group">
					<label for="order">Order</label>
					<input
						id="order"
						type="number"
						bind:value={order}
						placeholder="0"
						class="form-control"
						min="0"
					/>
					<small>For sidebar ordering (lower numbers appear first)</small>
				</div>
			</div>
			
			<div class="form-group checkbox-group">
				<label>
					<input
						type="checkbox"
						bind:checked={showInSidebar}
					/>
					Show in sidebar navigation
				</label>
			</div>
			
			<div class="form-group">
				<label>Content *</label>
				<RichTextEditor bind:content />
			</div>
			
			{#if pageData}
				<div class="meta-info">
					<small>
						Created: {new Date(pageData.createdAt).toLocaleString()} | 
						Updated: {new Date(pageData.updatedAt).toLocaleString()}
					</small>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.page-editor {
		max-width: 900px;
		margin: 0 auto;
	}
	
	.loading {
		text-align: center;
		padding: 2rem;
		font-size: 1.2rem;
		color: var(--text-secondary);
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
	
	.actions {
		display: flex;
		gap: 1rem;
	}
	
	.error-message {
		background: #f8d7da;
		color: #721c24;
		padding: 1rem;
		border-radius: 4px;
		margin-bottom: 1rem;
	}
	
	.editor-form {
		background: white;
		padding: 2rem;
		border-radius: 8px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}
	
	.form-group {
		margin-bottom: 1.5rem;
	}
	
	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}
	
	.checkbox-group {
		display: flex;
		align-items: center;
	}
	
	.checkbox-group label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
	}
	
	label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 500;
		color: var(--text-color);
	}
	
	.form-control {
		width: 100%;
		padding: 0.5rem;
		border: 1px solid var(--border-color);
		border-radius: 4px;
		font-size: 1rem;
		font-family: inherit;
	}
	
	.form-control:focus {
		outline: none;
		border-color: var(--primary-color);
		box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
	}
	
	textarea.form-control {
		resize: vertical;
	}
	
	small {
		display: block;
		margin-top: 0.25rem;
		color: var(--text-secondary);
		font-size: 0.875rem;
	}
	
	.btn {
		padding: 0.5rem 1rem;
		background: var(--primary-color);
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.875rem;
		font-weight: 500;
		transition: background 0.2s;
	}
	
	.btn:hover:not(:disabled) {
		background: var(--primary-hover);
	}
	
	.btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
	
	.btn-secondary {
		background: #6c757d;
	}
	
	.btn-secondary:hover:not(:disabled) {
		background: #5a6268;
	}
	
	.btn-danger {
		background: var(--error-color);
	}
	
	.btn-danger:hover:not(:disabled) {
		background: #c82333;
	}
	
	.meta-info {
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid var(--border-color);
		color: var(--text-secondary);
	}
	
	@media (max-width: 768px) {
		.form-row {
			grid-template-columns: 1fr;
		}
		
		.header {
			flex-direction: column;
			align-items: flex-start;
			gap: 1rem;
		}
		
		.actions {
			width: 100%;
			justify-content: flex-end;
		}
	}
</style>
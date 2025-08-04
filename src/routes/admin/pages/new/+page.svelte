<script lang="ts">
	import { goto } from '$app/navigation';
	import RichTextEditor from '$lib/components/RichTextEditor.svelte';
	
	let title = '';
	let slug = '';
	let content = '';
	let excerpt = '';
	let status: 'draft' | 'published' = 'draft';
	let showInSidebar = false;
	let order = 0;
	let metaDescription = '';
	let saving = false;
	let error = '';
	
	// Auto-generate slug from title
	$: if (title && !slug) {
		slug = title
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '');
	}
	
	async function savePage() {
		if (!title || !content || !slug) {
			error = 'Please fill in all required fields';
			return;
		}
		
		saving = true;
		error = '';
		
		try {
			const response = await fetch('/api/pages', {
				method: 'POST',
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
				const page = await response.json();
				goto(`/admin/pages/${page.slug}/edit`);
			} else {
				const data = await response.json();
				error = data.error || 'Failed to create page';
				if (data.details) {
					error += `: ${data.details}`;
				}
				console.error('Page creation failed:', data);
			}
		} catch (err) {
			console.error('Error creating page:', err);
			error = `Error creating page: ${err.message || err}`;
		} finally {
			saving = false;
		}
	}
	
	function cancel() {
		if (confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
			goto('/admin/pages');
		}
	}
</script>

<div class="page-editor">
	<div class="header">
		<h1>Create New Page</h1>
		<div class="actions">
			<button on:click={cancel} class="btn btn-secondary">Cancel</button>
			<button on:click={savePage} class="btn btn-primary" disabled={saving}>
				{saving ? 'Creating...' : 'Create Page'}
			</button>
		</div>
	</div>
	
	{#if error}
		<div class="error-message">{error}</div>
	{/if}
	
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
	</div>
</div>

<style>
	.page-editor {
		max-width: 900px;
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
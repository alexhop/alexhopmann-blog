<script lang="ts">
	import { goto } from '$app/navigation';
	import RichTextEditor from '$lib/components/RichTextEditor.svelte';
	
	let title = '';
	let slug = '';
	let content = '';
	let excerpt = '';
	let categories = '';
	let tags = '';
	let status: 'draft' | 'published' = 'draft';
	let featuredImage = '';
	let saving = false;
	let error = '';
	
	function generateSlug() {
		slug = title
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '');
	}
	
	async function handleSubmit() {
		error = '';
		saving = true;
		
		try {
			const response = await fetch('/api/posts', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					title,
					slug,
					content,
					excerpt,
					categories: categories.split(',').map(c => c.trim()).filter(Boolean),
					tags: tags.split(',').map(t => t.trim()).filter(Boolean),
					status,
					featuredImage,
					publishedAt: status === 'published' ? new Date() : undefined
				})
			});
			
			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || 'Failed to create post');
			}
			
			const { post } = await response.json();
			goto(`/admin/posts/${post.slug}/edit`);
		} catch (err) {
			error = err instanceof Error ? err.message : 'An error occurred';
		} finally {
			saving = false;
		}
	}
</script>

<svelte:head>
	<title>Create New Post - Admin</title>
</svelte:head>

<div class="post-editor">
	<div class="editor-header">
		<h1>Create New Post</h1>
		<div class="header-actions">
			<a href="/admin/posts" class="button">Cancel</a>
			<button 
				on:click={handleSubmit} 
				disabled={saving || !title || !slug || !content}
				class="button primary"
			>
				{saving ? 'Saving...' : 'Save Post'}
			</button>
		</div>
	</div>
	
	{#if error}
		<div class="error-message">
			{error}
		</div>
	{/if}
	
	<form on:submit|preventDefault={handleSubmit}>
		<div class="form-group">
			<label for="title">Title</label>
			<input
				id="title"
				type="text"
				bind:value={title}
				on:blur={generateSlug}
				placeholder="Enter post title"
				required
			/>
		</div>
		
		<div class="form-group">
			<label for="slug">Slug</label>
			<input
				id="slug"
				type="text"
				bind:value={slug}
				placeholder="post-url-slug"
				required
			/>
		</div>
		
		<div class="form-group">
			<label for="excerpt">Excerpt</label>
			<textarea
				id="excerpt"
				bind:value={excerpt}
				placeholder="Brief description of the post"
				rows="3"
			></textarea>
		</div>
		
		<div class="form-group">
			<label for="content">Content</label>
			<RichTextEditor bind:content />
		</div>
		
		<div class="form-row">
			<div class="form-group">
				<label for="categories">Categories (comma-separated)</label>
				<input
					id="categories"
					type="text"
					bind:value={categories}
					placeholder="Technology, Programming"
				/>
			</div>
			
			<div class="form-group">
				<label for="tags">Tags (comma-separated)</label>
				<input
					id="tags"
					type="text"
					bind:value={tags}
					placeholder="javascript, svelte, azure"
				/>
			</div>
		</div>
		
		<div class="form-group">
			<label for="featuredImage">Featured Image URL</label>
			<input
				id="featuredImage"
				type="url"
				bind:value={featuredImage}
				placeholder="https://example.com/image.jpg"
			/>
		</div>
		
		<div class="form-group">
			<label for="status">Status</label>
			<select id="status" bind:value={status}>
				<option value="draft">Draft</option>
				<option value="published">Published</option>
			</select>
		</div>
	</form>
</div>

<style>
	.post-editor {
		background: white;
		padding: 2rem;
		border-radius: 8px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		max-width: 1000px;
		margin: 0 auto;
	}
	
	.editor-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
	}
	
	.header-actions {
		display: flex;
		gap: 1rem;
	}
	
	.button {
		padding: 0.75rem 1.5rem;
		border-radius: 4px;
		font-weight: 500;
		border: 1px solid var(--border-color);
		background: white;
		color: var(--text-color);
		text-decoration: none;
		cursor: pointer;
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
	
	.button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none;
	}
	
	.error-message {
		background: #ffebee;
		color: #c62828;
		padding: 1rem;
		border-radius: 4px;
		margin-bottom: 1rem;
	}
	
	.form-group {
		margin-bottom: 1.5rem;
	}
	
	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.5rem;
	}
	
	label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 500;
		color: #666;
	}
	
	input[type="text"],
	input[type="url"],
	textarea,
	select {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid var(--border-color);
		border-radius: 4px;
		font-size: 1rem;
		transition: border-color 0.2s;
	}
	
	input:focus,
	textarea:focus,
	select:focus {
		outline: none;
		border-color: var(--primary-color);
	}
	
	textarea {
		resize: vertical;
	}
</style>
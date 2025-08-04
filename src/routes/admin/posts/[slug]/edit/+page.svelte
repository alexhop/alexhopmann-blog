<script lang="ts">
	import { goto } from '$app/navigation';
	import RichTextEditor from '$lib/components/RichTextEditor.svelte';
	import DebugError from '$lib/components/DebugError.svelte';
	
	export let data;
	
	let title = data.post.title;
	let content = data.post.content;
	let excerpt = data.post.excerpt;
	let categories = data.post.categories.join(', ');
	let tags = data.post.tags.join(', ');
	let status = data.post.status;
	let featuredImage = data.post.featuredImage || '';
	let saving = false;
	let error = '';
	let debugError: any = null;
	let shareSuccess = '';
	let sharing = false;
	
	async function handleSubmit() {
		error = '';
		saving = true;
		
		try {
			const response = await fetch(`/api/posts/${data.post.slug}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					title,
					content,
					excerpt,
					categories: categories.split(',').map(c => c.trim()).filter(Boolean),
					tags: tags.split(',').map(t => t.trim()).filter(Boolean),
					status,
					featuredImage,
					publishedAt: status === 'published' && !data.post.publishedAt ? new Date() : data.post.publishedAt
				})
			});
			
			if (!response.ok) {
				// Try to parse as JSON, but handle HTML error pages
				const contentType = response.headers.get('content-type');
				let errorMessage = 'Failed to update post';
				
				if (contentType && contentType.includes('application/json')) {
					try {
						const result = await response.json();
						errorMessage = result.error || errorMessage;
					} catch (e) {
						// JSON parsing failed
					}
				} else {
					// Likely an HTML error page
					if (response.status === 401) {
						errorMessage = 'Unauthorized - please log in again';
						// Redirect to login
						goto('/auth/login');
						return;
					} else if (response.status === 404) {
						errorMessage = 'API endpoint not found';
					} else {
						errorMessage = `Server error (${response.status})`;
					}
				}
				
				throw new Error(errorMessage);
			}
			
			goto('/admin/posts');
		} catch (err) {
			error = err instanceof Error ? err.message : 'An error occurred';
		} finally {
			saving = false;
		}
	}
	
	async function handleDelete() {
		if (!confirm('Are you sure you want to delete this post?')) return;
		
		error = '';
		debugError = null;
		
		try {
			const response = await fetch(`/api/posts/${data.post.slug}`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json'
				}
			});
			
			if (!response.ok) {
				// Capture full error details for debugging
				const contentType = response.headers.get('content-type');
				let errorMessage = 'Failed to delete post';
				let errorBody = null;
				
				if (contentType && contentType.includes('application/json')) {
					try {
						errorBody = await response.json();
						errorMessage = errorBody.error || errorMessage;
						
						// Log additional details if available
						if (errorBody.details) {
							console.error('Delete error details:', errorBody.details);
						}
					} catch (e) {
						// JSON parsing failed
						errorBody = { parseError: e.message };
					}
				} else {
					// Try to get text body
					try {
						errorBody = await response.text();
					} catch (e) {
						errorBody = 'Could not read response body';
					}
					
					// Likely an HTML error page
					if (response.status === 401) {
						errorMessage = 'Unauthorized - please log in again';
						// Redirect to login
						goto('/auth/login');
						return;
					} else if (response.status === 403) {
						errorMessage = 'You do not have permission to delete this post';
					} else if (response.status === 404) {
						errorMessage = 'Post not found';
					} else {
						errorMessage = `Server error (${response.status})`;
					}
				}
				
				// Create detailed error object
				const errorObj = new Error(errorMessage);
				errorObj.status = response.status;
				errorObj.statusText = response.statusText;
				errorObj.body = errorBody;
				errorObj.response = {
					status: response.status,
					statusText: response.statusText,
					url: response.url,
					headers: Object.fromEntries(response.headers.entries())
				};
				throw errorObj;
			}
			
			// Success - redirect to posts list
			goto('/admin/posts');
		} catch (err) {
			error = err instanceof Error ? err.message : 'An error occurred';
			debugError = err;
			console.error('Delete error:', err);
		}
	}
	
	async function shareToSocial(platform: string) {
		shareSuccess = '';
		error = '';
		sharing = true;
		
		try {
			const response = await fetch(`/api/posts/${data.post.slug}/share`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ platform })
			});
			
			if (!response.ok) {
				throw new Error('Failed to generate share link');
			}
			
			const result = await response.json();
			if (result.shareUrl) {
				window.open(result.shareUrl, '_blank');
				shareSuccess = `Share link opened for ${platform}`;
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to share';
		} finally {
			sharing = false;
		}
	}
</script>

<svelte:head>
	<title>Edit Post - {data.post.title}</title>
</svelte:head>

<div class="post-editor">
	<div class="editor-header">
		<h1>Edit Post</h1>
		<div class="header-actions">
			<button on:click={handleDelete} class="button danger">Delete</button>
			<a href="/admin/posts" class="button">Cancel</a>
			<button 
				on:click={handleSubmit} 
				disabled={saving || !title || !content}
				class="button primary"
			>
				{saving ? 'Saving...' : 'Save Changes'}
			</button>
		</div>
	</div>
	
	{#if error}
		<div class="error-message">
			{error}
		</div>
	{/if}
	
	<DebugError error={debugError} title="Debug Information - Delete Error" />
	
	{#if shareSuccess}
		<div class="success-message">
			{shareSuccess}
		</div>
	{/if}
	
	<form on:submit|preventDefault={handleSubmit}>
		<div class="form-group">
			<label for="title">Title</label>
			<input
				id="title"
				type="text"
				bind:value={title}
				placeholder="Enter post title"
				required
			/>
		</div>
		
		<div class="form-group">
			<label for="slug">Slug</label>
			<input
				id="slug"
				type="text"
				value={data.post.slug}
				disabled
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
	
	{#if data.post.status === 'published'}
		<div class="social-share-section">
			<h3>Share to Social Media</h3>
			<div class="social-buttons">
				<button
					on:click={() => shareToSocial('twitter')}
					disabled={sharing}
					class="social-button twitter"
				>
					Share to Twitter
				</button>
				<button
					on:click={() => shareToSocial('linkedin')}
					disabled={sharing}
					class="social-button linkedin"
				>
					Share to LinkedIn
				</button>
				<button
					on:click={() => shareToSocial('facebook')}
					disabled={sharing}
					class="social-button facebook"
				>
					Share to Facebook
				</button>
			</div>
		</div>
	{/if}
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
	
	.button.danger {
		background: var(--error-color);
		color: white;
		border-color: var(--error-color);
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
	
	input:disabled {
		background: #f5f5f5;
		cursor: not-allowed;
	}
	
	textarea {
		resize: vertical;
	}
	
	.social-share-section {
		margin-top: 3rem;
		padding-top: 2rem;
		border-top: 1px solid var(--border-color);
	}
	
	.social-share-section h3 {
		margin-bottom: 1rem;
	}
	
	.social-buttons {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
	}
	
	.social-button {
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 4px;
		color: white;
		font-weight: 500;
		cursor: pointer;
		transition: transform 0.2s, opacity 0.2s;
	}
	
	.social-button:hover {
		transform: translateY(-2px);
	}
	
	.social-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none;
	}
	
	.social-button.twitter {
		background: #1da1f2;
	}
	
	.social-button.linkedin {
		background: #0077b5;
	}
	
	.social-button.facebook {
		background: #1877f2;
	}
	
	.success-message {
		background: #e8f5e9;
		color: #2e7d32;
		padding: 1rem;
		border-radius: 4px;
		margin-bottom: 1rem;
	}
</style>
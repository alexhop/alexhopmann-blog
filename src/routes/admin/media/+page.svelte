<script lang="ts">
	import { onMount } from 'svelte';
	
	let files: any[] = [];
	let uploading = false;
	let loading = false;
	let error = '';
	let selectedFile: File | null = null;
	
	onMount(loadFiles);
	
	async function loadFiles() {
		loading = true;
		try {
			const response = await fetch('/api/media');
			if (!response.ok) throw new Error('Failed to load files');
			
			const data = await response.json();
			files = data.files;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load files';
		} finally {
			loading = false;
		}
	}
	
	function handleFileSelect(event: Event) {
		const input = event.target as HTMLInputElement;
		if (input.files && input.files[0]) {
			selectedFile = input.files[0];
		}
	}
	
	async function handleUpload() {
		if (!selectedFile) return;
		
		uploading = true;
		error = '';
		
		try {
			const formData = new FormData();
			formData.append('file', selectedFile);
			
			const response = await fetch('/api/media', {
				method: 'POST',
				body: formData
			});
			
			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || 'Upload failed');
			}
			
			// Reload files
			await loadFiles();
			
			// Reset
			selectedFile = null;
			const input = document.getElementById('file-input') as HTMLInputElement;
			if (input) input.value = '';
		} catch (err) {
			error = err instanceof Error ? err.message : 'Upload failed';
		} finally {
			uploading = false;
		}
	}
	
	function copyToClipboard(url: string) {
		navigator.clipboard.writeText(url);
		alert('URL copied to clipboard!');
	}
	
	function formatBytes(bytes: number): string {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	}
	
	function formatDate(date: Date | string): string {
		return new Date(date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<svelte:head>
	<title>Media Library - Admin</title>
</svelte:head>

<div class="media-page">
	<div class="page-header">
		<h1>Media Library</h1>
	</div>
	
	<div class="upload-section">
		<h2>Upload New Media</h2>
		<div class="upload-form">
			<input
				id="file-input"
				type="file"
				accept="image/*,video/*"
				on:change={handleFileSelect}
				disabled={uploading}
			/>
			<button
				on:click={handleUpload}
				disabled={!selectedFile || uploading}
				class="button primary"
			>
				{uploading ? 'Uploading...' : 'Upload'}
			</button>
		</div>
		{#if error}
			<div class="error-message">{error}</div>
		{/if}
		{#if selectedFile}
			<div class="selected-file">
				Selected: {selectedFile.name} ({formatBytes(selectedFile.size)})
			</div>
		{/if}
	</div>
	
	<div class="media-grid-section">
		<h2>All Media</h2>
		{#if loading}
			<div class="loading">Loading media files...</div>
		{:else if files.length === 0}
			<div class="empty-state">
				<p>No media files uploaded yet.</p>
			</div>
		{:else}
			<div class="media-grid">
				{#each files as file}
					<div class="media-item">
						{#if file.type.startsWith('image/')}
							<img src={file.url} alt={file.name} />
						{:else if file.type.startsWith('video/')}
							<video src={file.url} controls>
								<track kind="captions" />
							</video>
						{:else}
							<div class="file-placeholder">
								{file.type}
							</div>
						{/if}
						<div class="media-info">
							<p class="file-name">{file.name}</p>
							<p class="file-meta">
								{formatBytes(file.size)} • {formatDate(file.uploadedAt)}
							</p>
							<button
								on:click={() => copyToClipboard(file.url)}
								class="copy-button"
							>
								Copy URL
							</button>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<style>
	.media-page {
		background: white;
		padding: 2rem;
		border-radius: 8px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}
	
	.page-header {
		margin-bottom: 2rem;
	}
	
	.upload-section {
		margin-bottom: 3rem;
		padding-bottom: 2rem;
		border-bottom: 1px solid var(--border-color);
	}
	
	.upload-section h2 {
		margin-bottom: 1rem;
	}
	
	.upload-form {
		display: flex;
		gap: 1rem;
		align-items: center;
	}
	
	input[type="file"] {
		flex: 1;
		padding: 0.5rem;
		border: 1px solid var(--border-color);
		border-radius: 4px;
	}
	
	.button {
		padding: 0.75rem 1.5rem;
		border-radius: 4px;
		font-weight: 500;
		border: 1px solid var(--border-color);
		background: white;
		color: var(--text-color);
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
		padding: 0.75rem;
		border-radius: 4px;
		margin-top: 1rem;
	}
	
	.selected-file {
		margin-top: 0.5rem;
		color: #666;
		font-size: 0.9rem;
	}
	
	.media-grid-section h2 {
		margin-bottom: 1.5rem;
	}
	
	.loading, .empty-state {
		text-align: center;
		padding: 2rem;
		color: #666;
	}
	
	.media-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
		gap: 1.5rem;
	}
	
	.media-item {
		border: 1px solid var(--border-color);
		border-radius: 8px;
		overflow: hidden;
		transition: transform 0.2s, box-shadow 0.2s;
	}
	
	.media-item:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
	}
	
	.media-item img,
	.media-item video {
		width: 100%;
		height: 200px;
		object-fit: cover;
	}
	
	.file-placeholder {
		width: 100%;
		height: 200px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #f5f5f5;
		color: #666;
		font-size: 0.9rem;
	}
	
	.media-info {
		padding: 1rem;
	}
	
	.file-name {
		font-weight: 500;
		margin-bottom: 0.5rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	
	.file-meta {
		font-size: 0.85rem;
		color: #666;
		margin-bottom: 0.75rem;
	}
	
	.copy-button {
		background: none;
		border: 1px solid var(--primary-color);
		color: var(--primary-color);
		padding: 0.25rem 0.75rem;
		border-radius: 4px;
		font-size: 0.85rem;
		cursor: pointer;
		transition: all 0.2s;
	}
	
	.copy-button:hover {
		background: var(--primary-color);
		color: white;
	}
</style>
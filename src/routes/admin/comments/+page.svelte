<script lang="ts">
	export let data;
	
	let processing = new Set<string>();
	
	async function approveComment(commentId: string, postId: string) {
		processing.add(commentId);
		processing = processing;
		
		try {
			const response = await fetch('/api/comments', {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ commentId, postId })
			});
			
			if (!response.ok) throw new Error('Failed to approve comment');
			
			// Remove from list
			data.comments = data.comments.filter(c => c.id !== commentId);
		} catch (error) {
			console.error('Error approving comment:', error);
			alert('Failed to approve comment');
		} finally {
			processing.delete(commentId);
			processing = processing;
		}
	}
	
	async function deleteComment(commentId: string, postId: string) {
		if (!confirm('Are you sure you want to delete this comment?')) return;
		
		processing.add(commentId);
		processing = processing;
		
		try {
			const response = await fetch('/api/comments', {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ commentId, postId })
			});
			
			if (!response.ok) throw new Error('Failed to delete comment');
			
			// Remove from list
			data.comments = data.comments.filter(c => c.id !== commentId);
		} catch (error) {
			console.error('Error deleting comment:', error);
			alert('Failed to delete comment');
		} finally {
			processing.delete(commentId);
			processing = processing;
		}
	}
	
	function formatDate(date: Date | string) {
		return new Date(date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
	
	$: pendingComments = data.comments.filter(c => !c.approved);
	$: approvedComments = data.comments.filter(c => c.approved);
</script>

<svelte:head>
	<title>Manage Comments - Admin</title>
</svelte:head>

<div class="comments-page">
	<h1>Comments Management</h1>
	
	<div class="comments-section">
		<h2>Pending Approval ({pendingComments.length})</h2>
		{#if pendingComments.length === 0}
			<p class="empty-state">No pending comments</p>
		{:else}
			<div class="comments-list">
				{#each pendingComments as comment}
					<div class="comment-card">
						<div class="comment-header">
							<div class="comment-info">
								<strong>{comment.author.name}</strong>
								<span class="email">({comment.author.email})</span>
								<span class="separator">•</span>
								<span class="date">{formatDate(comment.createdAt)}</span>
							</div>
							<div class="comment-post">
								On: {comment.postTitle}
							</div>
						</div>
						<div class="comment-content">
							{@html comment.content}
						</div>
						<div class="comment-actions">
							<button
								on:click={() => approveComment(comment.id, comment.postId)}
								disabled={processing.has(comment.id)}
								class="button approve"
							>
								{processing.has(comment.id) ? 'Processing...' : 'Approve'}
							</button>
							<button
								on:click={() => deleteComment(comment.id, comment.postId)}
								disabled={processing.has(comment.id)}
								class="button delete"
							>
								Delete
							</button>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
	
	<div class="comments-section">
		<h2>Approved Comments ({approvedComments.length})</h2>
		{#if approvedComments.length === 0}
			<p class="empty-state">No approved comments</p>
		{:else}
			<div class="comments-list">
				{#each approvedComments as comment}
					<div class="comment-card approved">
						<div class="comment-header">
							<div class="comment-info">
								<strong>{comment.author.name}</strong>
								<span class="email">({comment.author.email})</span>
								<span class="separator">•</span>
								<span class="date">{formatDate(comment.createdAt)}</span>
							</div>
							<div class="comment-post">
								On: {comment.postTitle}
							</div>
						</div>
						<div class="comment-content">
							{@html comment.content}
						</div>
						<div class="comment-actions">
							<button
								on:click={() => deleteComment(comment.id, comment.postId)}
								disabled={processing.has(comment.id)}
								class="button delete"
							>
								Delete
							</button>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<style>
	.comments-page {
		background: white;
		padding: 2rem;
		border-radius: 8px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}
	
	h1 {
		margin-bottom: 2rem;
	}
	
	.comments-section {
		margin-bottom: 3rem;
	}
	
	.comments-section h2 {
		margin-bottom: 1rem;
		color: #666;
	}
	
	.empty-state {
		text-align: center;
		padding: 2rem;
		color: #999;
		background: #f9f9f9;
		border-radius: 8px;
	}
	
	.comments-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	
	.comment-card {
		border: 1px solid var(--border-color);
		border-radius: 8px;
		padding: 1.5rem;
		background: #fffcf0;
	}
	
	.comment-card.approved {
		background: white;
	}
	
	.comment-header {
		margin-bottom: 1rem;
	}
	
	.comment-info {
		font-size: 0.9rem;
		margin-bottom: 0.5rem;
	}
	
	.email {
		color: #666;
	}
	
	.separator {
		margin: 0 0.5rem;
		color: #999;
	}
	
	.date {
		color: #666;
	}
	
	.comment-post {
		font-size: 0.85rem;
		color: var(--primary-color);
	}
	
	.comment-content {
		margin-bottom: 1rem;
		line-height: 1.6;
		padding: 1rem;
		background: white;
		border-radius: 4px;
	}
	
	.comment-actions {
		display: flex;
		gap: 0.75rem;
	}
	
	.button {
		padding: 0.5rem 1rem;
		border: 1px solid var(--border-color);
		border-radius: 4px;
		background: white;
		cursor: pointer;
		font-size: 0.9rem;
		transition: all 0.2s;
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
	
	.button.approve {
		background: var(--success-color);
		color: white;
		border-color: var(--success-color);
	}
	
	.button.delete {
		background: var(--error-color);
		color: white;
		border-color: var(--error-color);
	}
</style>
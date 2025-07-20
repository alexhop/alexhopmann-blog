<script lang="ts">
	import { onMount } from 'svelte';
	
	export let postSlug: string;
	
	interface CommentWithReplies {
		id: string;
		postId: string;
		author: {
			name: string;
			email: string;
			avatar?: string;
		};
		content: string;
		createdAt: string;
		approved: boolean;
		parentId?: string;
		replies?: CommentWithReplies[];
	}
	
	let comments: CommentWithReplies[] = [];
	let loading = true;
	let submitting = false;
	let error = '';
	let success = '';
	
	// Form fields
	let newComment = {
		name: '',
		email: '',
		content: '',
		replyTo: null as string | null
	};
	
	onMount(loadComments);
	
	async function loadComments() {
		try {
			const response = await fetch(`/api/posts/${postSlug}/comments`);
			if (!response.ok) throw new Error('Failed to load comments');
			
			const data = await response.json();
			comments = data.comments;
		} catch (err) {
			console.error('Error loading comments:', err);
		} finally {
			loading = false;
		}
	}
	
	async function submitComment() {
		error = '';
		success = '';
		submitting = true;
		
		try {
			const response = await fetch(`/api/posts/${postSlug}/comments`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					author: {
						name: newComment.name,
						email: newComment.email
					},
					content: newComment.content,
					parentId: newComment.replyTo
				})
			});
			
			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || 'Failed to submit comment');
			}
			
			const data = await response.json();
			success = data.message;
			
			// Reset form
			newComment = {
				name: '',
				email: '',
				content: '',
				replyTo: null
			};
			
			// Store commenter info for next time
			localStorage.setItem('commenter_name', newComment.name);
			localStorage.setItem('commenter_email', newComment.email);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to submit comment';
		} finally {
			submitting = false;
		}
	}
	
	function startReply(commentId: string) {
		newComment.replyTo = commentId;
		// Scroll to form
		document.getElementById('comment-form')?.scrollIntoView({ behavior: 'smooth' });
	}
	
	function cancelReply() {
		newComment.replyTo = null;
	}
	
	function formatDate(date: string) {
		return new Date(date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
	
	// Load saved commenter info
	onMount(() => {
		newComment.name = localStorage.getItem('commenter_name') || '';
		newComment.email = localStorage.getItem('commenter_email') || '';
	});
</script>

<div class="comments-section">
	<h2>Comments</h2>
	
	{#if loading}
		<div class="loading">Loading comments...</div>
	{:else if comments.length === 0}
		<p class="no-comments">No comments yet. Be the first to comment!</p>
	{:else}
		<div class="comments-list">
			{#each comments as comment}
				<div class="comment">
					<div class="comment-header">
						<div class="comment-author">
							{#if comment.author.avatar}
								<img src={comment.author.avatar} alt={comment.author.name} class="author-avatar" />
							{:else}
								<div class="author-avatar placeholder">
									{comment.author.name.charAt(0).toUpperCase()}
								</div>
							{/if}
							<div>
								<div class="author-name">{comment.author.name}</div>
								<div class="comment-date">{formatDate(comment.createdAt)}</div>
							</div>
						</div>
						<button 
							on:click={() => startReply(comment.id)}
							class="reply-button"
						>
							Reply
						</button>
					</div>
					<div class="comment-content">
						{@html comment.content}
					</div>
					
					{#if comment.replies && comment.replies.length > 0}
						<div class="replies">
							{#each comment.replies as reply}
								<div class="comment reply">
									<div class="comment-header">
										<div class="comment-author">
											{#if reply.author.avatar}
												<img src={reply.author.avatar} alt={reply.author.name} class="author-avatar" />
											{:else}
												<div class="author-avatar placeholder">
													{reply.author.name.charAt(0).toUpperCase()}
												</div>
											{/if}
											<div>
												<div class="author-name">{reply.author.name}</div>
												<div class="comment-date">{formatDate(reply.createdAt)}</div>
											</div>
										</div>
									</div>
									<div class="comment-content">
										{@html reply.content}
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
	
	<div id="comment-form" class="comment-form">
		<h3>Leave a Comment</h3>
		
		{#if newComment.replyTo}
			<div class="replying-to">
				Replying to comment
				<button on:click={cancelReply} class="cancel-reply">Cancel</button>
			</div>
		{/if}
		
		{#if error}
			<div class="error-message">{error}</div>
		{/if}
		
		{#if success}
			<div class="success-message">{success}</div>
		{/if}
		
		<form on:submit|preventDefault={submitComment}>
			<div class="form-row">
				<div class="form-group">
					<label for="name">Name</label>
					<input
						id="name"
						type="text"
						bind:value={newComment.name}
						required
						disabled={submitting}
					/>
				</div>
				<div class="form-group">
					<label for="email">Email (will not be published)</label>
					<input
						id="email"
						type="email"
						bind:value={newComment.email}
						required
						disabled={submitting}
					/>
				</div>
			</div>
			
			<div class="form-group">
				<label for="comment">Comment</label>
				<textarea
					id="comment"
					bind:value={newComment.content}
					rows="5"
					required
					disabled={submitting}
					placeholder="Write your comment here..."
				></textarea>
			</div>
			
			<button type="submit" disabled={submitting} class="submit-button">
				{submitting ? 'Submitting...' : 'Submit Comment'}
			</button>
		</form>
	</div>
</div>

<style>
	.comments-section {
		margin-top: 4rem;
		padding-top: 2rem;
		border-top: 1px solid var(--border-color);
	}
	
	h2 {
		margin-bottom: 2rem;
	}
	
	.loading, .no-comments {
		text-align: center;
		color: #666;
		padding: 2rem;
	}
	
	.comments-list {
		margin-bottom: 3rem;
	}
	
	.comment {
		margin-bottom: 1.5rem;
		padding: 1.5rem;
		background: #f9f9f9;
		border-radius: 8px;
	}
	
	.comment.reply {
		margin-left: 2rem;
		margin-top: 1rem;
		background: #f5f5f5;
	}
	
	.comment-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}
	
	.comment-author {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}
	
	.author-avatar {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		object-fit: cover;
	}
	
	.author-avatar.placeholder {
		background: var(--primary-color);
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
	}
	
	.author-name {
		font-weight: 600;
		margin-bottom: 0.25rem;
	}
	
	.comment-date {
		font-size: 0.85rem;
		color: #666;
	}
	
	.reply-button {
		background: none;
		border: none;
		color: var(--primary-color);
		cursor: pointer;
		font-size: 0.9rem;
		padding: 0.25rem 0.75rem;
		border-radius: 4px;
		transition: background 0.2s;
	}
	
	.reply-button:hover {
		background: rgba(0, 122, 204, 0.1);
	}
	
	.comment-content {
		line-height: 1.6;
	}
	
	.replies {
		margin-top: 1rem;
	}
	
	.comment-form {
		background: white;
		padding: 2rem;
		border-radius: 8px;
		border: 1px solid var(--border-color);
	}
	
	.comment-form h3 {
		margin-bottom: 1.5rem;
	}
	
	.replying-to {
		background: #e3f2fd;
		padding: 0.75rem;
		border-radius: 4px;
		margin-bottom: 1rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	
	.cancel-reply {
		background: none;
		border: none;
		color: var(--primary-color);
		cursor: pointer;
		text-decoration: underline;
	}
	
	.error-message {
		background: #ffebee;
		color: #c62828;
		padding: 1rem;
		border-radius: 4px;
		margin-bottom: 1rem;
	}
	
	.success-message {
		background: #e8f5e9;
		color: #2e7d32;
		padding: 1rem;
		border-radius: 4px;
		margin-bottom: 1rem;
	}
	
	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
		margin-bottom: 1rem;
	}
	
	.form-group {
		margin-bottom: 1rem;
	}
	
	label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 500;
		color: #666;
	}
	
	input, textarea {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid var(--border-color);
		border-radius: 4px;
		font-size: 1rem;
		font-family: inherit;
		transition: border-color 0.2s;
	}
	
	input:focus, textarea:focus {
		outline: none;
		border-color: var(--primary-color);
	}
	
	input:disabled, textarea:disabled {
		background: #f5f5f5;
		cursor: not-allowed;
	}
	
	.submit-button {
		background: var(--primary-color);
		color: white;
		border: none;
		padding: 0.75rem 2rem;
		border-radius: 4px;
		font-weight: 500;
		cursor: pointer;
		transition: transform 0.2s, box-shadow 0.2s;
	}
	
	.submit-button:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
	}
	
	.submit-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none;
	}
	
	@media (max-width: 768px) {
		.form-row {
			grid-template-columns: 1fr;
		}
		
		.comment.reply {
			margin-left: 1rem;
		}
	}
</style>
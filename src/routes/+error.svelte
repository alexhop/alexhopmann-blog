<script lang="ts">
	import { page } from '$app/stores';
</script>

<svelte:head>
	<title>{$page.status} - Alex Hopmann</title>
</svelte:head>

<div class="error-page">
	<div class="container">
		<h1>{$page.status}</h1>
		<p class="error-message">
			{#if $page.status === 404}
				Page not found
			{:else}
				{$page.error?.message || 'An error occurred'}
			{/if}
		</p>
		<a href="/" class="button">Go Home</a>
	</div>
</div>

<style>
	.error-page {
		min-height: 60vh;
		display: flex;
		align-items: center;
		justify-content: center;
		text-align: center;
	}
	
	h1 {
		font-size: 4rem;
		margin-bottom: 1rem;
		color: var(--primary-color);
	}
	
	.error-message {
		font-size: 1.5rem;
		margin-bottom: 2rem;
		color: #666;
	}
	
	.button {
		display: inline-block;
		padding: 0.75rem 2rem;
		background: var(--primary-color);
		color: white;
		border-radius: 4px;
		font-weight: 500;
		transition: transform 0.2s, box-shadow 0.2s;
	}
	
	.button:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
		text-decoration: none;
	}
</style>
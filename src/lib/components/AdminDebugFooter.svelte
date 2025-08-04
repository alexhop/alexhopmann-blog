<script lang="ts">
	import { BUILD_VERSION, BUILD_TIMESTAMP, BUILD_FEATURES } from '$lib/version';
	import { page } from '$app/stores';
	
	let showDetails = false;
</script>

<div class="debug-footer">
	<div class="debug-content">
		<div class="debug-summary">
			<span class="debug-label">Build:</span>
			<span class="debug-value">{BUILD_VERSION}</span>
			<span class="debug-separator">|</span>
			<span class="debug-label">Route:</span>
			<span class="debug-value">{$page.route.id}</span>
			<span class="debug-separator">|</span>
			<button 
				class="debug-toggle"
				on:click={() => showDetails = !showDetails}
			>
				{showDetails ? 'Hide' : 'Show'} Details
			</button>
		</div>
		
		{#if showDetails}
			<div class="debug-details">
				<div class="detail-row">
					<strong>Build Timestamp:</strong>
					<span>{BUILD_TIMESTAMP}</span>
				</div>
				<div class="detail-row">
					<strong>Environment:</strong>
					<span>Production</span>
				</div>
				<div class="detail-row">
					<strong>Features:</strong>
					<ul>
						{#each BUILD_FEATURES as feature}
							<li>{feature}</li>
						{/each}
					</ul>
				</div>
				<div class="detail-row">
					<strong>Current URL:</strong>
					<span>{$page.url.pathname}</span>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.debug-footer {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		background: #263238;
		color: #eceff1;
		font-size: 0.85rem;
		font-family: 'Monaco', 'Consolas', monospace;
		z-index: 9999;
		box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.2);
	}
	
	.debug-content {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0.5rem 1rem;
	}
	
	.debug-summary {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	
	.debug-label {
		color: #90a4ae;
	}
	
	.debug-value {
		color: #4fc3f7;
		font-weight: 500;
	}
	
	.debug-separator {
		color: #546e7a;
	}
	
	.debug-toggle {
		background: none;
		border: 1px solid #546e7a;
		color: #90a4ae;
		padding: 0.25rem 0.5rem;
		border-radius: 3px;
		cursor: pointer;
		font-size: 0.8rem;
		margin-left: auto;
	}
	
	.debug-toggle:hover {
		background: #37474f;
		color: #eceff1;
		border-color: #607d8b;
	}
	
	.debug-details {
		margin-top: 0.75rem;
		padding-top: 0.75rem;
		border-top: 1px solid #37474f;
	}
	
	.detail-row {
		margin-bottom: 0.5rem;
		display: flex;
		gap: 0.5rem;
		align-items: flex-start;
	}
	
	.detail-row strong {
		color: #90a4ae;
		min-width: 150px;
	}
	
	.detail-row ul {
		margin: 0;
		padding-left: 1.5rem;
		list-style: disc;
	}
	
	.detail-row li {
		color: #b0bec5;
		margin-bottom: 0.25rem;
	}
	
	/* Add padding to the main content to prevent overlap */
	:global(body) {
		padding-bottom: 50px;
	}
</style>
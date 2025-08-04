<script lang="ts">
	export let error: any = null;
	export let title = 'Debug Information';
	
	$: errorDetails = error ? {
		message: error.message || error.error || 'Unknown error',
		status: error.status,
		statusText: error.statusText,
		body: error.body,
		stack: error.stack,
		response: error.response,
		raw: error
	} : null;
</script>

{#if errorDetails}
	<div class="debug-error">
		<h3>{title}</h3>
		<div class="error-content">
			<div class="error-field">
				<strong>Message:</strong>
				<span>{errorDetails.message}</span>
			</div>
			
			{#if errorDetails.status}
				<div class="error-field">
					<strong>Status:</strong>
					<span>{errorDetails.status} {errorDetails.statusText || ''}</span>
				</div>
			{/if}
			
			{#if errorDetails.body}
				<div class="error-field">
					<strong>Response Body:</strong>
					<pre>{JSON.stringify(errorDetails.body, null, 2)}</pre>
				</div>
			{/if}
			
			{#if errorDetails.response}
				<div class="error-field">
					<strong>Response:</strong>
					<pre>{JSON.stringify(errorDetails.response, null, 2)}</pre>
				</div>
			{/if}
			
			<details>
				<summary>Full Error Object</summary>
				<pre>{JSON.stringify(errorDetails.raw, null, 2)}</pre>
			</details>
			
			{#if errorDetails.stack}
				<details>
					<summary>Stack Trace</summary>
					<pre>{errorDetails.stack}</pre>
				</details>
			{/if}
		</div>
	</div>
{/if}

<style>
	.debug-error {
		background: #fff3cd;
		border: 1px solid #ffeaa7;
		border-radius: 4px;
		padding: 1rem;
		margin: 1rem 0;
	}
	
	h3 {
		margin: 0 0 1rem 0;
		color: #856404;
	}
	
	.error-content {
		font-size: 0.9rem;
	}
	
	.error-field {
		margin-bottom: 0.5rem;
	}
	
	.error-field strong {
		display: inline-block;
		min-width: 120px;
		color: #856404;
	}
	
	pre {
		background: #f8f9fa;
		padding: 0.5rem;
		border-radius: 4px;
		overflow-x: auto;
		white-space: pre-wrap;
		word-wrap: break-word;
		margin: 0.5rem 0;
		font-size: 0.85rem;
	}
	
	details {
		margin-top: 0.5rem;
		cursor: pointer;
	}
	
	summary {
		font-weight: bold;
		color: #856404;
		padding: 0.25rem 0;
	}
	
	summary:hover {
		text-decoration: underline;
	}
</style>
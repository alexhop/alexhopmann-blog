<script lang="ts">
	export let data;
</script>

<svelte:head>
	<title>Login - Alex Hopmann</title>
</svelte:head>

<div class="container">
	<div class="login-box">
		<h1>Admin Login</h1>
		
		{#if data.error}
			<div class="error">
				{#if data.error === 'unauthorized'}
					Access denied. Only authorized users can access the admin area.
				{:else if data.error === 'rate_limit'}
					Too many login attempts. Please try again later.
				{:else}
					Login failed. Please try again.
				{/if}
			</div>
		{/if}
		
		<p>Please sign in to access the admin area.</p>
		
		<a href={data.authUrl} class="login-button">
			Sign in with Microsoft
		</a>
	</div>
</div>

<style>
	.login-box {
		max-width: 400px;
		margin: 4rem auto;
		padding: 2rem;
		border: 1px solid var(--border-color);
		border-radius: 8px;
		background: white;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}
	
	h1 {
		margin-bottom: 1rem;
		text-align: center;
	}
	
	p {
		text-align: center;
		margin-bottom: 2rem;
	}
	
	.login-button {
		display: block;
		width: 100%;
		padding: 1rem;
		background: var(--primary-color);
		color: white;
		text-align: center;
		border-radius: 4px;
		font-weight: 500;
		transition: background 0.2s;
	}
	
	.login-button:hover {
		background: #005a9e;
		text-decoration: none;
	}
	
	.error {
		background: #ffebee;
		color: #c62828;
		padding: 1rem;
		border-radius: 4px;
		margin-bottom: 1rem;
	}
</style>
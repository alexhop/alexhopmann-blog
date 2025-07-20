<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Editor } from '@tiptap/core';
	import StarterKit from '@tiptap/starter-kit';
	import Image from '@tiptap/extension-image';
	import Link from '@tiptap/extension-link';
	
	export let content = '';
	export let placeholder = 'Write your content here...';
	
	let element: HTMLElement;
	let editor: Editor;
	
	onMount(() => {
		editor = new Editor({
			element,
			extensions: [
				StarterKit,
				Image,
				Link.configure({
					openOnClick: false,
				})
			],
			content,
			onTransaction: () => {
				// Force re-render
				editor = editor;
			},
			onUpdate: ({ editor }) => {
				content = editor.getHTML();
			}
		});
	});
	
	onDestroy(() => {
		if (editor) {
			editor.destroy();
		}
	});
	
	function addImage() {
		const url = window.prompt('Enter image URL:');
		if (url) {
			editor.chain().focus().setImage({ src: url }).run();
		}
	}
	
	function addLink() {
		const url = window.prompt('Enter link URL:');
		if (url) {
			editor.chain().focus().setLink({ href: url }).run();
		}
	}
</script>

<div class="editor">
	{#if editor}
		<div class="toolbar">
			<button
				on:click={() => editor.chain().focus().toggleBold().run()}
				class:active={editor.isActive('bold')}
				type="button"
			>
				Bold
			</button>
			<button
				on:click={() => editor.chain().focus().toggleItalic().run()}
				class:active={editor.isActive('italic')}
				type="button"
			>
				Italic
			</button>
			<button
				on:click={() => editor.chain().focus().toggleStrike().run()}
				class:active={editor.isActive('strike')}
				type="button"
			>
				Strike
			</button>
			<div class="separator"></div>
			<button
				on:click={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
				class:active={editor.isActive('heading', { level: 1 })}
				type="button"
			>
				H1
			</button>
			<button
				on:click={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
				class:active={editor.isActive('heading', { level: 2 })}
				type="button"
			>
				H2
			</button>
			<button
				on:click={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
				class:active={editor.isActive('heading', { level: 3 })}
				type="button"
			>
				H3
			</button>
			<div class="separator"></div>
			<button
				on:click={() => editor.chain().focus().toggleBulletList().run()}
				class:active={editor.isActive('bulletList')}
				type="button"
			>
				Bullet List
			</button>
			<button
				on:click={() => editor.chain().focus().toggleOrderedList().run()}
				class:active={editor.isActive('orderedList')}
				type="button"
			>
				Ordered List
			</button>
			<button
				on:click={() => editor.chain().focus().toggleCodeBlock().run()}
				class:active={editor.isActive('codeBlock')}
				type="button"
			>
				Code Block
			</button>
			<div class="separator"></div>
			<button on:click={addLink} type="button">Link</button>
			<button on:click={addImage} type="button">Image</button>
			<div class="separator"></div>
			<button
				on:click={() => editor.chain().focus().undo().run()}
				disabled={!editor.can().undo()}
				type="button"
			>
				Undo
			</button>
			<button
				on:click={() => editor.chain().focus().redo().run()}
				disabled={!editor.can().redo()}
				type="button"
			>
				Redo
			</button>
		</div>
	{/if}
	
	<div class="editor-content" bind:this={element}></div>
</div>

<style>
	.editor {
		border: 1px solid var(--border-color);
		border-radius: 4px;
		overflow: hidden;
	}
	
	.toolbar {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		padding: 0.5rem;
		border-bottom: 1px solid var(--border-color);
		background: #f9f9f9;
	}
	
	.toolbar button {
		padding: 0.5rem 0.75rem;
		border: 1px solid transparent;
		background: white;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.9rem;
		transition: all 0.2s;
	}
	
	.toolbar button:hover {
		background: #f0f0f0;
	}
	
	.toolbar button.active {
		background: var(--primary-color);
		color: white;
	}
	
	.toolbar button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	
	.separator {
		width: 1px;
		background: var(--border-color);
		margin: 0 0.25rem;
	}
	
	.editor-content {
		min-height: 400px;
		padding: 1rem;
	}
	
	:global(.editor-content .ProseMirror) {
		min-height: 400px;
		outline: none;
	}
	
	:global(.editor-content h1) {
		font-size: 2rem;
		margin: 1rem 0;
	}
	
	:global(.editor-content h2) {
		font-size: 1.5rem;
		margin: 1rem 0;
	}
	
	:global(.editor-content h3) {
		font-size: 1.25rem;
		margin: 1rem 0;
	}
	
	:global(.editor-content p) {
		margin: 0.5rem 0;
	}
	
	:global(.editor-content ul, .editor-content ol) {
		margin: 0.5rem 0;
		padding-left: 2rem;
	}
	
	:global(.editor-content pre) {
		background: #f5f5f5;
		padding: 1rem;
		border-radius: 4px;
		overflow-x: auto;
		margin: 1rem 0;
	}
	
	:global(.editor-content img) {
		max-width: 100%;
		height: auto;
		margin: 1rem 0;
	}
</style>
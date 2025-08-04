import DOMPurify from 'isomorphic-dompurify';

export function sanitizeHtml(html: string): string {
	// Configure DOMPurify to allow safe HTML elements and attributes
	const config = {
		ALLOWED_TAGS: [
			'p', 'br', 'strong', 'em', 'u', 's', 'strike',
			'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
			'blockquote', 'pre', 'code',
			'ul', 'ol', 'li',
			'a', 'img', 'video', 'audio',
			'table', 'thead', 'tbody', 'tr', 'th', 'td',
			'div', 'span', 'article', 'section', 'header', 'footer',
			'figure', 'figcaption', 'iframe'
		],
		ALLOWED_ATTR: [
			'href', 'src', 'alt', 'title', 'width', 'height',
			'class', 'id', 'style', 'target', 'rel',
			'controls', 'autoplay', 'loop', 'muted',
			'frameborder', 'allowfullscreen', 'loading'
		],
		ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
		ADD_ATTR: ['target', 'rel'],
		FORBID_TAGS: ['script', 'style'],
		FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover']
	};
	
	// Sanitize the HTML
	return DOMPurify.sanitize(html, config);
}
"use client"; // render on client; for SSR you can drop this (isomorphic-dompurify works in both)
import DOMPurify from "isomorphic-dompurify";
import clsx from "clsx";

export default function SafeHTML({
	html,
	className,
}: {
	html: string;
	className?: string;
}) {
	const clean = DOMPurify.sanitize(html, {
		ALLOWED_TAGS: [
			"p",
			"a",
			"strong",
			"em",
			"ul",
			"ol",
			"li",
			"br",
			"h1",
			"h2",
			"h3",
			"h4",
			"blockquote",
			"img",
			"code",
			"pre",
		],
		ALLOWED_ATTR: [
			"href",
			"target",
			"rel",
			"alt",
			"title",
			"src",
			"loading",
		],
		ADD_ATTR: ["rel"],
	});

	// Ensure external links are safe
	const withLinkRels = clean.replaceAll(
		/<a ([^>]*?)>/g,
		(m, attrs) => `<a ${attrs} rel="noopener noreferrer nofollow">`
	);

	return (
		<div
			className={clsx(className)}
			dangerouslySetInnerHTML={{ __html: withLinkRels }}
		/>
	);
}

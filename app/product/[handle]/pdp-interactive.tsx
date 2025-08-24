"use client";
import { useMemo, useState, useCallback } from "react";
import type { ProductDetail, VariantNode } from "@/lib/queries";
import { AnimatePresence, motion } from "framer-motion";
import SafeHTML from "@/utils/safe-html";
import OptionPicker from "./option-picker";

function pickImageForVariant(
	variant: VariantNode | null,
	gallery: { url: string; altText?: string | null }[],
	fallback: { url: string; altText?: string | null } | null
) {
	if (variant?.image?.url) return variant.image;
	if (!variant) return fallback;
	const values = variant.selectedOptions.map((o) => o.value.toLowerCase());
	const byAlt = gallery.find((img) =>
		(img.altText || "")
			.toLowerCase()
			.split(/\s|,|\./)
			.some((w) => values.includes(w))
	);
	if (byAlt) return byAlt;
	const byUrl = gallery.find((img) =>
		values.some((v) => img.url.toLowerCase().includes(v))
	);
	return byUrl || fallback;
}

export default function PdpInteractive({
	product,
}: {
	product: Pick<
		ProductDetail,
		| "title"
		| "descriptionHtml"
		| "featuredImage"
		| "images"
		| "options"
		| "variants"
	>;
}) {
	// Build a deduped gallery list
	const gallery = useMemo(() => {
		const imgs = [
			...(product.images?.edges?.map((e) => e.node) ?? []),
			...(product.featuredImage ? [product.featuredImage] : []),
		];
		const seen = new Set<string>();
		return imgs.filter(
			(img) => !!img?.url && !seen.has(img.url) && seen.add(img.url)
		);
	}, [product.images, product.featuredImage]);

	const initial = product.featuredImage ?? gallery[0] ?? null;
	const [main, setMain] = useState<{
		url: string;
		altText?: string | null;
	} | null>(initial);
	const [forceVariantId, setForceVariantId] = useState<string | undefined>(
		undefined
	);

	const handleVariantChange = useCallback(
		(variant: VariantNode | null) => {
			const next = pickImageForVariant(variant, gallery, initial);
			if (next && next.url !== main?.url) setMain(next);
		},
		[gallery, initial, main?.url]
	);

	// Try to match a variant for a clicked thumbnail and instruct the picker to select it
	const onThumbClick = useCallback(
		(img: { url: string; altText?: string | null }) => {
			setMain(img);
			// Exact URL match first
			const variants = product.variants.edges.map((e) => e.node);
			let match =
				variants.find((v) => v.image?.url && v.image.url === img.url) ||
				null;
			if (!match) {
				const tokens = `${img.altText || ""} ${img.url}`.toLowerCase();
				match =
					variants.find((v) =>
						v.selectedOptions.some((o) =>
							tokens.includes(o.value.toLowerCase())
						)
					) || null;
			}
			if (match) setForceVariantId(match.id);
		},
		[product.variants]
	);

	return (
		<div className="grid grid-cols-1 gap-8 md:grid-cols-2">
			{/* Media column */}
			<div>
				<div className="relative overflow-hidden rounded-2xl">
					<div className="aspect-square w-full">
						<AnimatePresence mode="wait">
							<motion.img
								key={main?.url || "placeholder"}
								src={main?.url || ""}
								alt={main?.altText || product.title}
								className="h-full w-full object-cover"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								transition={{ duration: 0.25 }}
							/>
						</AnimatePresence>
					</div>
				</div>

				{/* Thumbnails */}
				{gallery.length > 1 && (
					<div className="mt-3 flex gap-2 overflow-x-auto">
						{gallery.map((img) => {
							const selected = img.url === main?.url;
							return (
								// eslint-disable-next-line @next/next/no-img-element
								<img
									key={img.url}
									src={img.url}
									alt={img.altText || product.title}
									onClick={() => onThumbClick(img)}
									className={`h-16 w-16 cursor-pointer rounded-lg object-cover ring-2 transition ${
										selected
											? "ring-black"
											: "ring-transparent hover:ring-gray-300"
									}`}
									aria-current={selected ? "true" : undefined}
								/>
							);
						})}
					</div>
				)}
			</div>

			{/* Details column */}
			<div>
				<h1 className="mb-2 text-2xl font-semibold">{product.title}</h1>

				<OptionPicker
					product={{
						options: product.options,
						variants: product.variants,
					}}
					onVariantChange={handleVariantChange}
					forceVariantId={forceVariantId}
				/>

				<SafeHTML
					html={product.descriptionHtml}
					className="prose my-6"
				/>
			</div>
		</div>
	);
}

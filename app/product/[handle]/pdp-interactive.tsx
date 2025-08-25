"use client";
import { useMemo, useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { ProductDetail, VariantNode } from "@/lib/queries";
import { AnimatePresence, motion } from "framer-motion";
import SafeHTML from "@/utils/safe-html";
import OptionPicker from "./option-picker";

// URL key for an option name (e.g., "Ring Size" -> "ring_size")
const toParamKey = (name: string) =>
	name.trim().toLowerCase().split(" ").join("_");

// build a query string from a variant's selectedOptions
function paramsForVariant(variant: VariantNode, options: { name: string }[]) {
  const p = new URLSearchParams();
  for (const opt of options) {
    const sel = variant.selectedOptions.find(o => o.name === opt.name)?.value;
    if (sel) p.set(toParamKey(opt.name), sel);
  }
  return p.toString();
}


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

	// URL state
	const router = useRouter();
	const searchParams = useSearchParams();

	// On first render: if URL has option params, select the matching variant
	useEffect(() => {
		if (!product?.options?.length) return;
		const wanted: Record<string, string> = {};
		for (const opt of product.options) {
			const key = toParamKey(opt.name);
			const val = searchParams.get(key);
			if (val) wanted[opt.name] = val;
		}
		if (Object.keys(wanted).length === 0) return;

		const variants = product.variants.edges.map((e) => e.node);
		const match =
			variants.find((v) =>
				v.selectedOptions.every(
					(o) => !wanted[o.name] || wanted[o.name] === o.value
				)
			) || null;

		if (match) setForceVariantId(match.id);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// When variant changes, update image + reflect selections in the URL (shallow)
const handleVariantChange = useCallback(
	(variant: VariantNode | null) => {
		// 1) swap hero image (fade)
		const next = pickImageForVariant(variant, gallery, initial);
		if (next && next.url !== main?.url) setMain(next);

		// 2) reflect selection in URL only if it actually changes
		if (variant) {
			const targetQs = paramsForVariant(variant, product.options);
			const currentQs =
				typeof window !== "undefined"
					? window.location.search.slice(1)
					: ""; // safe on client

			if (targetQs !== currentQs) {
				// shallow replace to avoid history spam; no scroll jump
				router.replace(`?${targetQs}`);
			}
		}
	},
	[gallery, initial, main?.url, product.options, router] // <-- NO searchParams here
);

	// Thumbnail click → try to select a matching variant (exact image URL first, then by option tokens)
	const onThumbClick = useCallback(
		(img: { url: string; altText?: string | null }) => {
			setMain(img);
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

"use client";
import { useMemo, useState, useEffect } from "react";
import type { ProductDetail, VariantNode } from "@/lib/queries";
import AddToCart from "./add-to-cart";

function matchesAll(
	variant: VariantNode,
	partial: Record<string, string>
): boolean {
	return Object.entries(partial).every(([name, val]) => {
		const found = variant.selectedOptions.find((o) => o.name === name);
		return !found || found.value === val; // allow unspecified options
	});
}

export default function OptionPicker({
	product,
}: {
	product: Pick<ProductDetail, "options" | "variants">;
}) {
	const variants = useMemo(
		() => product.variants.edges.map((e) => e.node),
		[product.variants]
	);

	// Default variant = first available or first
	const defaultVariant =
		variants.find((v) => v.availableForSale) ?? variants[0] ?? null;
	const defaultSelections = useMemo(() => {
		const entries =
			defaultVariant?.selectedOptions.map((o) => [o.name, o.value]) ?? [];
		return Object.fromEntries(entries) as Record<string, string>;
	}, [defaultVariant]);

	const [selections, setSelections] =
		useState<Record<string, string>>(defaultSelections);

	// Guided auto‑selection: whenever selections change, ensure each option has a valid value.
	useEffect(() => {
		const next = { ...selections };
		let changed = false;
		for (const opt of product.options) {
			const currentVal = next[opt.name];
			const currentValid =
				currentVal &&
				variants.some(
					(v) =>
						v.availableForSale &&
						matchesAll(v, { ...next, [opt.name]: currentVal })
				);
			if (!currentValid) {
				// pick first available value for this option
				const fallback = opt.values.find((val) =>
					variants.some(
						(v) =>
							v.availableForSale &&
							matchesAll(v, { ...next, [opt.name]: val })
					)
				);
				if (fallback) {
					next[opt.name] = fallback;
					changed = true;
				} else {
					delete next[opt.name];
				}
			}
		}
		if (changed) setSelections(next);
	}, [selections, product.options, variants]);

	const current = useMemo(() => {
		return (
			variants.find((v) =>
				v.selectedOptions.every((o) => selections[o.name] === o.value)
			) || null
		);
	}, [variants, selections]);

	function setOption(name: string, value: string) {
		setSelections((prev) => ({ ...prev, [name]: value }));
	}

	const displayPrice = (current ?? defaultVariant)?.price;

	return (
		<div className="space-y-6">
			{product.options.map((opt) => (
				<div key={opt.name}>
					<div
						className="mb-2 text-sm font-medium"
						id={`option-label-${opt.name}`}
					>
						{opt.name}
					</div>
					{/* A11y: use radiogroup semantics for single‑select lists */}
					<div
						className="flex flex-wrap gap-2"
						role="radiogroup"
						aria-labelledby={`option-label-${opt.name}`}
					>
						{opt.values.map((val) => {
							const selected = selections[opt.name] === val;
							const available = variants.some(
								(v) =>
									v.availableForSale &&
									matchesAll(v, {
										...selections,
										[opt.name]: val,
									})
							);
							const ariaLabel = available
								? val
								: `${val} (unavailable)`;
							return (
								<button
									key={val}
									type="button"
									role="radio"
									aria-checked={selected}
									aria-disabled={!available}
									aria-label={ariaLabel}
									onClick={() =>
										available && setOption(opt.name, val)
									}
									disabled={!available}
									className={`rounded-full border px-3 py-1 text-sm ${
										selected
											? "bg-black text-white"
											: "bg-white"
									} ${
										available
											? "hover:shadow"
											: "opacity-40 cursor-not-allowed"
									}`}
								>
									<span aria-hidden="true">{val}</span>
									{!available && (
										<span className="sr-only">
											{" "}
											(unavailable)
										</span>
									)}
								</button>
							);
						})}
					</div>
				</div>
			))}

			{displayPrice && (
				<div className="text-lg font-medium">
					{new Intl.NumberFormat(undefined, {
						style: "currency",
						currency: displayPrice.currencyCode,
					}).format(parseFloat(displayPrice.amount))}
				</div>
			)}

			{current ? (
				<AddToCart merchandiseId={current.id} />
			) : (
				<button
					className="rounded-xl bg-gray-200 px-5 py-3 text-gray-500"
					disabled
					aria-disabled="true"
				>
					Unavailable selection
				</button>
			)}
		</div>
	);
}

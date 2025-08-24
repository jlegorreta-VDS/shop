"use client";
import { useMemo, useState } from "react";
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

	// Default selections: use the first *available* variant, otherwise first
	const defaultVariant =
		variants.find((v) => v.availableForSale) ?? variants[0] ?? null;
	const defaultSelections = useMemo(() => {
		const entries =
			defaultVariant?.selectedOptions.map((o) => [o.name, o.value]) ?? [];
		return Object.fromEntries(entries) as Record<string, string>;
	}, [defaultVariant]);

	const [selections, setSelections] =
		useState<Record<string, string>>(defaultSelections);

	// Compute the currently selected variant (may be unavailable/null if combo doesn't exist)
	const current = useMemo(() => {
		return (
			variants.find((v) =>
				v.selectedOptions.every((o) => selections[o.name] === o.value)
			) || null
		);
	}, [variants, selections]);

	// Whether a particular value for an option is selectable given current selections
	function isValueAvailable(optionName: string, value: string): boolean {
		const trial = { ...selections, [optionName]: value };
		// There is availability if any variant matches all chosen values and is for sale
		return variants.some((v) => v.availableForSale && matchesAll(v, trial));
	}

	function setOption(name: string, value: string) {
		setSelections((prev) => ({ ...prev, [name]: value }));
	}

	const displayPrice = (current ?? defaultVariant)?.price;

	return (
		<div className="space-y-6">
			{product.options.map((opt) => (
				<div key={opt.name}>
					<div className="mb-2 text-sm font-medium">{opt.name}</div>
					<div className="flex flex-wrap gap-2">
						{opt.values.map((val) => {
							const selected = selections[opt.name] === val;
							const available = isValueAvailable(opt.name, val);
							return (
								<button
									key={val}
									type="button"
									onClick={() => setOption(opt.name, val)}
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
									aria-pressed={selected}
								>
									{val}
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
				>
					Unavailable selection
				</button>
			)}
		</div>
	);
}

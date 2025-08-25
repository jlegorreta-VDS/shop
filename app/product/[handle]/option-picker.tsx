"use client";
import { useEffect, useMemo, useState } from "react";
import type { ProductDetail, VariantNode } from "@/lib/queries";
import AddToCart from "./add-to-cart";

function matchesAll(
	variant: VariantNode,
	partial: Record<string, string>
): boolean {
	return Object.entries(partial).every(([name, val]) => {
		const found = variant.selectedOptions.find((o) => o.name === name);
		return !found || found.value === val;
	});
}

export default function OptionPicker({
	product,
	onVariantChange,
	forceVariantId,
	lowStockThreshold = 2,
}: {
	product: Pick<ProductDetail, "options" | "variants">;
	onVariantChange?: (variant: VariantNode | null) => void;
	forceVariantId?: string;
	lowStockThreshold?: number;
}) {
	const variants = useMemo(
		() => product.variants.edges.map((e) => e.node),
		[product.variants]
	);
	const defaultVariant =
		variants.find((v) => v.availableForSale) ?? variants[0] ?? null;

	const selectionsFromVariant = (
		v: VariantNode | null
	): Record<string, string> => {
		const entries = v?.selectedOptions.map((o) => [o.name, o.value]) ?? [];
		return Object.fromEntries(entries) as Record<string, string>;
	};

	const defaultSelections = useMemo(
		() => selectionsFromVariant(defaultVariant),
		[defaultVariant]
	);
	const [selections, setSelections] =
		useState<Record<string, string>>(defaultSelections);

  useEffect(() => {
    if (!forceVariantId) return;
    const v = variants.find((v) => v.id === forceVariantId) || null;
    if (!v) return;
    setSelections((prev) => {
      const next = selectionsFromVariant(v);
      return JSON.stringify(next) !== JSON.stringify(prev) ? next : prev;
    });
  }, [forceVariantId, variants]);

	useEffect(() => {
		const next = { ...selections };
		let changed = false;
		for (const opt of product.options) {
			const val = next[opt.name];
			const valid =
				val &&
				variants.some(
					(v) =>
						v.availableForSale &&
						matchesAll(v, { ...next, [opt.name]: val })
				);
			if (!valid) {
				const fallback = opt.values.find((val2) =>
					variants.some(
						(v) =>
							v.availableForSale &&
							matchesAll(v, { ...next, [opt.name]: val2 })
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

	const current = useMemo(
		() =>
			variants.find((v) =>
				v.selectedOptions.every((o) => selections[o.name] === o.value)
			) || null,
		[variants, selections]
	);

	useEffect(() => {
		if (onVariantChange) onVariantChange(current ?? null);
	}, [current, onVariantChange]);

	function setOption(name: string, value: string) {
		setSelections((prev) => ({ ...prev, [name]: value }));
	}

	function stockFor(trial: Record<string, string>): number {
		return variants
			.filter((v) => v.availableForSale && matchesAll(v, trial))
			.reduce(
				(sum, v) =>
					sum +
					(typeof v.quantityAvailable === "number"
						? v.quantityAvailable
						: 0),
				0
			);
	}

	const displayPrice = (current ?? defaultVariant)?.price;
	const currentQty =
		typeof current?.quantityAvailable === "number"
			? current.quantityAvailable
			: 0;

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
					<div
						className="flex flex-wrap gap-2"
						role="radiogroup"
						aria-labelledby={`option-label-${opt.name}`}
					>
						{opt.values.map((val) => {
							const trial = { ...selections, [opt.name]: val };
							const selected = selections[opt.name] === val;
							const count = stockFor(trial);
							const available = count > 0;
							const low = available && count <= lowStockThreshold;
							const ariaLabel = available
								? `${val} (${count}${low ? " low" : ""})`
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
									className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm ${
										selected
											? "bg-black text-white"
											: "bg-white"
									} ${
										available
											? "hover:shadow"
											: "opacity-40 cursor-not-allowed"
									}`}
								>
									<span
										aria-hidden="true"
										className={
											!available ? "line-through" : ""
										}
									>
										{val}
									</span>
									<span
										className="text-xs opacity-70"
										aria-hidden="true"
									>
										{available ? `(${count})` : `(0)`}
									</span>
									{low && (
										<span className="rounded bg-amber-100 px-1 text-[10px] font-medium text-amber-900">
											Low
										</span>
									)}
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

			{current && (
				<div className="-mt-2 text-sm">
					{current.availableForSale ? (
						currentQty <= lowStockThreshold ? (
							<span className="inline-block rounded bg-amber-100 px-2 py-0.5 text-amber-900">
								Only {currentQty} left
							</span>
						) : (
							<span className="inline-block rounded bg-emerald-100 px-2 py-0.5 text-emerald-900">
								In stock
							</span>
						)
					) : (
						<span className="inline-block rounded bg-gray-200 px-2 py-0.5 text-gray-600">
							Out of stock
						</span>
					)}
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

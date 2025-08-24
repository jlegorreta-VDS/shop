"use client";
import { useState } from "react";
import type { VariantNode } from "@/lib/queries";
import AddToCart from "./add-to-cart";

export default function VariantSelector({
	variants,
}: {
	variants: VariantNode[];
}) {
	const [selected, setSelected] = useState<VariantNode | null>(
		variants.find((v) => v.availableForSale) || variants[0] || null
	);

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap gap-2">
				{variants.map((variant) => (
					<button
						key={variant.id}
						disabled={!variant.availableForSale}
						onClick={() => setSelected(variant)}
						className={`rounded-lg border px-3 py-1 text-sm ${
							selected?.id === variant.id
								? "bg-black text-white"
								: "bg-white"
						} ${
							variant.availableForSale
								? ""
								: "opacity-40 cursor-not-allowed"
						}`}
					>
						{variant.title}
					</button>
				))}
			</div>

			{selected && (
				<>
					<div className="text-lg font-medium">
						{new Intl.NumberFormat(undefined, {
							style: "currency",
							currency: selected.price.currencyCode,
						}).format(parseFloat(selected.price.amount))}
					</div>
					<AddToCart merchandiseId={selected.id} />
				</>
			)}
		</div>
	);
}

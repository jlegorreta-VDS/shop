"use client";
import { useCart } from "@/store/cart";
import { useUI } from "@/store/ui";
import { useState } from "react";

export default function AddToCart({
	merchandiseId,
}: {
	merchandiseId: string;
}) {
	const setCart = useCart((s) => s.setCart);
	const openCart = useUI((s) => s.openCart);
	const [loading, setLoading] = useState(false);

	async function add() {
		if (loading) return;
		setLoading(true);
		try {
			const res = await fetch("/api/cart/add", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ merchandiseId, quantity: 1 }),
			});
			const data = await res.json();
			setCart(data.id, data.totalQuantity);
			openCart(); // <-- show the drawer
		} finally {
			setLoading(false);
		}
	}

	return (
		<button
			onClick={add}
			className="rounded-xl bg-black px-5 py-3 text-white hover:opacity-90 disabled:opacity-50"
			disabled={loading}
			aria-busy={loading ? "true" : "false"}
		>
			{loading ? "Adding…" : "Add to cart"}
		</button>
	);
}

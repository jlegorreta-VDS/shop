"use client";
import { useCart } from "@/store/cart";

export default function AddToCart({	merchandiseId }: { merchandiseId: string }) {
	const setCart = useCart((s) => s.setCart);

	async function add() {
		const res = await fetch("/api/cart/add", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ merchandiseId, quantity: 1 }),
		});
		const data = await res.json();
		setCart(data.id, data.totalQuantity);
	}

	return (
		<button onClick={add} className="rounded-xl bg-black px-5 py-3 text-white hover:opacity-90">Add to cart</button>
	);
}

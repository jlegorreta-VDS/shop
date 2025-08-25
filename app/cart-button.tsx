"use client";
import { useCart } from "@/store/cart";
import { useUI } from "@/store/ui";

export default function CartButton() {
	const qty = useCart((s) => s.totalQuantity);
	const openCart = useUI((s) => s.openCart);

	return (
		<button onClick={openCart} className="relative underline">
			Cart{qty ? ` (${qty})` : ""}
		</button>
	);
}

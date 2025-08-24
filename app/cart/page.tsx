"use client";
import { useEffect, useState } from "react";
import { useCart } from "@/store/cart";
import type { Cart } from "@/lib/queries"; 

export default function CartPage() {
	const { cartId, setCart, clear } = useCart();
	const [cart, setCartState] = useState<Cart | null>(null); 

	useEffect(() => {
		(async () => {
			if (!cartId) return;
			const res = await fetch(
				`/api/cart?id=${encodeURIComponent(cartId)}`
			);
			if (!res.ok) return; // optionally handle error UI
			const data: Cart = await res.json();
			setCartState(data);
			setCart(data.id, data.totalQuantity);
		})();
	}, [cartId, setCart]);

	async function update(lineId: string, quantity: number) {
		const res = await fetch("/api/cart/update", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ cartId, lineId, quantity }),
		});
		if (!res.ok) return;
		const data: Cart = await res.json();
		setCartState(data);
		setCart(data.id, data.totalQuantity);
	}

	async function remove(lineId: string) {
		const res = await fetch("/api/cart/remove", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ cartId, lineIds: [lineId] }),
		});
		if (!res.ok) return;
		const data: Cart = await res.json();
		setCartState(data);
		setCart(data.id, data.totalQuantity);
	}

	if (!cartId || !cart) return <p>Your cart is empty.</p>;

	return (
		<div className="space-y-6">
			<ul className="divide-y rounded-2xl border">
				{cart.lines.edges.map((e) => (
					<li
						key={e.node.id}
						className="flex items-center justify-between p-4"
					>
						<div>
							<div className="font-medium">
								{e.node.merchandise.product.title}
							</div>
							<div className="text-sm text-gray-500">
								Qty {e.node.quantity}
							</div>
						</div>
						<div className="flex items-center gap-4">
							<span>
								{new Intl.NumberFormat(undefined, {
									style: "currency",
									currency:
										e.node.cost.totalAmount.currencyCode,
								}).format(
									parseFloat(e.node.cost.totalAmount.amount)
								)}
							</span>
							<button
								onClick={() =>
									update(e.node.id, e.node.quantity + 1)
								}
								className="text-sm underline"
							>
								+1
							</button>
							<button
								onClick={() =>
									update(
										e.node.id,
										Math.max(1, e.node.quantity - 1)
									)
								}
								className="text-sm underline"
							>
								-1
							</button>
							<button
								onClick={() => remove(e.node.id)}
								className="text-sm underline"
							>
								Remove
							</button>
						</div>
					</li>
				))}
			</ul>
			<div className="flex items-center justify-between">
				<div className="text-lg font-medium">Subtotal</div>
				<div className="text-lg font-semibold">
					{new Intl.NumberFormat(undefined, {
						style: "currency",
						currency: cart.cost.subtotalAmount.currencyCode,
					}).format(parseFloat(cart.cost.subtotalAmount.amount))}
				</div>
			</div>
			<a
				href={cart.checkoutUrl}
				className="inline-block rounded-xl bg-black px-5 py-3 text-white"
			>
				Checkout
			</a>
			<button
				onClick={() => {
					clear();
					location.reload();
				}}
				className="rounded-xl border px-5 py-3"
			>
				Clear
			</button>
		</div>
	);
}

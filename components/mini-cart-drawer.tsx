"use client";
import { useEffect, useState } from "react";
import { useUI } from "@/store/ui";
import { useCart } from "@/store/cart";
import type { Cart } from "@/lib/queries";

export default function MiniCartDrawer() {
	const { isCartOpen, closeCart } = useUI();
	const { cartId, setCart } = useCart();
	const [cart, setCartState] = useState<Cart | null>(null);
	const visible = isCartOpen;

	useEffect(() => {
		(async () => {
			if (!visible || !cartId) return;
			const res = await fetch(
				`/api/cart?id=${encodeURIComponent(cartId)}`
			);
			if (!res.ok) return;
			const data: Cart = await res.json();
			setCartState(data);
			setCart(data.id, data.totalQuantity);
		})();
	}, [visible, cartId, setCart]);

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

	// Simple ESC to close
	useEffect(() => {
		function onKey(e: KeyboardEvent) {
			if (e.key === "Escape") closeCart();
		}
		if (visible) window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [visible, closeCart]);

	// Basic overlay + panel
	return (
		<div
			aria-hidden={!visible}
			className={`fixed inset-0 z-50 ${
				visible ? "pointer-events-auto" : "pointer-events-none"
			}`}
		>
			{/* overlay */}
			<div
				onClick={closeCart}
				className={`absolute inset-0 bg-black/40 transition-opacity ${
					visible ? "opacity-100" : "opacity-0"
				}`}
			/>
			{/* panel */}
			<aside
				role="dialog"
				aria-label="Shopping cart"
				className={`absolute right-0 top-0 h-full w-full max-w-md transform bg-white shadow-xl transition-transform ${
					visible ? "translate-x-0" : "translate-x-full"
				}`}
			>
				<div className="flex items-center justify-between border-b p-4">
					<h2 className="text-lg font-semibold">Your cart</h2>
					<button
						onClick={closeCart}
						aria-label="Close"
						className="rounded p-2 hover:bg-gray-100"
					>
						✕
					</button>
				</div>

				{!cartId || !cart ? (
					<div className="p-6 text-sm text-gray-600">
						Your cart is empty.
					</div>
				) : (
					<div className="flex h-[calc(100%-56px)] flex-col">
						<ul className="flex-1 divide-y overflow-auto">
							{cart.lines.edges.map(({ node }) => (
								<li
									key={node.id}
									className="flex items-center justify-between p-4"
								>
									<div>
										<div className="font-medium">
											{node.merchandise.product.title}
										</div>
										<div className="text-xs text-gray-500">
											{node.merchandise.title}
										</div>
										<div className="mt-1 flex items-center gap-2 text-sm">
											<button
												onClick={() =>
													update(
														node.id,
														Math.max(
															1,
															node.quantity - 1
														)
													)
												}
												className="rounded border px-2"
											>
												–
											</button>
											<span>{node.quantity}</span>
											<button
												onClick={() =>
													update(
														node.id,
														node.quantity + 1
													)
												}
												className="rounded border px-2"
											>
												+
											</button>
											<button
												onClick={() => remove(node.id)}
												className="ml-2 text-xs underline"
											>
												Remove
											</button>
										</div>
									</div>
									<div className="text-sm font-medium">
										{new Intl.NumberFormat(undefined, {
											style: "currency",
											currency:
												node.cost.totalAmount
													.currencyCode,
										}).format(
											parseFloat(
												node.cost.totalAmount.amount
											)
										)}
									</div>
								</li>
							))}
						</ul>

						<div className="border-t p-4">
							<div className="mb-3 flex items-center justify-between text-sm">
								<span>Subtotal</span>
								<span className="font-semibold">
									{new Intl.NumberFormat(undefined, {
										style: "currency",
										currency:
											cart.cost.subtotalAmount
												.currencyCode,
									}).format(
										parseFloat(
											cart.cost.subtotalAmount.amount
										)
									)}
								</span>
							</div>
							<a
								href={cart.checkoutUrl}
								className="block w-full rounded-xl bg-black px-5 py-3 text-center text-white hover:opacity-90"
							>
								Checkout
							</a>
						</div>
					</div>
				)}
			</aside>
		</div>
	);
}

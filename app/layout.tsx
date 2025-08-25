import "./globals.css";
import Link from "next/link";
import { ReactNode } from "react";
import CartButton from "./cart-button";
import MiniCartDrawer from "@/components/mini-cart-drawer";


export const metadata = {
	title: "Shop",
	description: "Headless Shopify + Next.js",
};

export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html lang="en">
			<body className="min-h-screen bg-white text-gray-900">
				<header className="border-b">
					<nav className="mx-auto flex max-w-5xl items-center justify-between p-4">
						<Link href="/" className="font-semibold">
							Vega Shop
						</Link>
						<CartButton />
					</nav>
				</header>
				<MiniCartDrawer />
				<main className="mx-auto max-w-5xl p-4">{children}</main>
				<footer className="mx-auto max-w-5xl p-6 text-sm text-gray-500">
					© {new Date().getFullYear()} Vega Design Studio
				</footer>
			</body>
		</html>
	);
}

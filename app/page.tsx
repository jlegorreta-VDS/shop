import Link from "next/link";
import { getProducts } from "@/lib/queries";

export default async function HomePage() {
	const products = await getProducts(24);
	return (
		<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
			{products.map((p) => (
				<Link
					key={p.id}
					href={`/product/${p.handle}`}
					className="rounded-2xl border p-4 hover:shadow"
				>
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img
						src={p.featuredImage?.url || ""}
						alt={p.featuredImage?.altText || p.title}
						className="mb-3 aspect-square w-full rounded-xl object-cover"
					/>
					<div className="flex items-center justify-between">
						<h3 className="font-medium">{p.title}</h3>
						<span>{p.price}</span>
					</div>
				</Link>
			))}
		</div>
	);
}

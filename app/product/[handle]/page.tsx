import { getProductByHandle } from "@/lib/queries";
import AddToCart from "./add-to-cart";
import { notFound } from "next/navigation";
import SafeHTML from "@/utils/safe-html";

export default async function ProductPage({
	params,
}: {
	params: Promise<{ handle: string }>;
}) {
	const { handle } = await params; // ⟵ await params
	const product = await getProductByHandle(handle);
	if (!product) return notFound();
	const firstVariant = product.variants?.edges?.[0]?.node;

	return (
		<div className="grid grid-cols-1 gap-8 md:grid-cols-2">
			{/* eslint-disable-next-line @next/next/no-img-element */}
			<img
				src={
					product.featuredImage?.url ||
					product.images?.edges?.[0]?.node?.url ||
					""
				}
				alt={product.featuredImage?.altText || product.title}
				className="aspect-square w-full rounded-2xl object-cover"
			/>
			<div>
				<h1 className="mb-2 text-2xl font-semibold">{product.title}</h1>
				<SafeHTML
					html={product.descriptionHtml}
					className="prose mb-4"
				/>
				{firstVariant && <AddToCart merchandiseId={firstVariant.id} />}
			</div>
		</div>
	);
}

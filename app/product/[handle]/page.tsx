// app/product/[handle]/page.tsx
import { getProductByHandle } from "@/lib/queries";
import { notFound } from "next/navigation";
import PdpInteractive from "./pdp-interactive";

export default async function ProductPage({
	params,
}: {
	params: Promise<{ handle: string }>;
}) {
	const { handle } = await params;
	const product = await getProductByHandle(handle);
	if (!product) return notFound();

	return (
		<PdpInteractive
			product={{
				title: product.title,
				descriptionHtml: product.descriptionHtml,
				featuredImage: product.featuredImage ?? null,
				images: product.images,
				options: product.options,
				variants: product.variants,
			}}
		/>
	);
}

import { GraphQLClient, gql } from "graphql-request";

function normalizeDomain(raw: string): string {
	const noProto = raw.replace(/^https?:\/\//i, "");
	return noProto.split("/")[0];
}

const RAW_SHOP = process.env.SHOPIFY_STORE_DOMAIN;
const TOKEN = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
const VERSION = process.env.SHOPIFY_API_VERSION || "2024-07";

if (!RAW_SHOP) throw new Error("Missing SHOPIFY_STORE_DOMAIN env var");
if (!TOKEN) throw new Error("Missing SHOPIFY_STOREFRONT_ACCESS_TOKEN env var");

const SHOP = normalizeDomain(RAW_SHOP);
export const endpoint = `https://${SHOP}/api/${VERSION}/graphql.json`;

export const shopify = new GraphQLClient(endpoint, {
	headers: {
		"X-Shopify-Storefront-Access-Token": TOKEN,
		"Content-Type": "application/json",
	},
});

export const GQL = { gql };

export async function shopifyHealth(): Promise<{
	ok: boolean;
	shop?: string;
	message?: string;
}> {
	try {
		const data = await shopify.request<{ shop: { name: string } }>(
			gql`
				{
					shop {
						name
					}
				}
			`
		);
		return { ok: true, shop: data.shop.name };
	} catch (e: unknown) {
		if (typeof e === "object" && e !== null && "response" in e) {
			const err = e as { response?: unknown };
			return { ok: false, message: JSON.stringify(err.response) };
		}
		return { ok: false, message: String(e) };
	}
}

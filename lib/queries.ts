import { GQL, shopify } from "./shopify";
const { gql } = GQL;

// ---------- Shared helper types ----------
export type Edge<T> = { node: T };

// ---------- Product list (Home) ----------
export type ProductCard = {
	id: string;
	handle: string;
	title: string;
	featuredImage?: { url: string; altText?: string | null } | null;
	price: string; // formatted in getProducts
};

type ProductsResponse = {
	products: {
		edges: Edge<{
			id: string;
			handle: string;
			title: string;
			featuredImage?: { url: string; altText?: string | null } | null;
			priceRange: {
				minVariantPrice: { amount: string; currencyCode: string };
			};
		}>[];
	};
};

export async function getProducts(limit = 24): Promise<ProductCard[]> {
	const query = gql/* GraphQL */ `
		query Products($limit: Int!) {
			products(first: $limit, sortKey: UPDATED_AT, reverse: true) {
				edges {
					node {
						id
						handle
						title
						featuredImage {
							url
							altText
						}
						priceRange {
							minVariantPrice {
								amount
								currencyCode
							}
						}
					}
				}
			}
		}
	`;
	const data = await shopify.request<ProductsResponse>(query, { limit });
	return data.products.edges.map((e) => ({
		id: e.node.id,
		handle: e.node.handle,
		title: e.node.title,
		featuredImage: e.node.featuredImage ?? null,
		price: new Intl.NumberFormat(undefined, {
			style: "currency",
			currency: e.node.priceRange.minVariantPrice.currencyCode,
		}).format(parseFloat(e.node.priceRange.minVariantPrice.amount)),
	}));
}

// ---------- Single product ----------
export type VariantNode = {
	id: string;
	title: string;
	availableForSale: boolean;
	price: { amount: string; currencyCode: string };
	selectedOptions: { name: string; value: string }[];
  image?: { url: string; altText?: string | null } | null;
  quantityAvailable?: number | null;
};

export type ProductDetail = {
	id: string;
	title: string;
	handle: string;
	descriptionHtml: string;
	featuredImage?: { url: string; altText?: string | null } | null;
	images: { edges: Edge<{ url: string; altText?: string | null }>[] };
	options: { name: string; values: string[] }[]; // <-- add this line
	variants: { edges: Edge<VariantNode>[] };
};

type ProductResponse = { product: ProductDetail | null };

export async function getProductByHandle(handle: string) {
const query = gql/* GraphQL */ `
	query Product($handle: String!) {
		product(handle: $handle) {
			id
			title
			handle
			descriptionHtml
			featuredImage {
				url
				altText
			}
			images(first: 8) {
				edges {
					node {
						url
						altText
					}
				}
			}
			options {
				name
				values
			}
			variants(first: 50) {
				edges {
					node {
						id
						title
						availableForSale
						price {
							amount
							currencyCode
						}
						selectedOptions {
							name
							value
						}
            image{ url altText }
            quantityAvailable
					}
				}
			}
		}
	}
`;
	const data = await shopify.request<ProductResponse>(query, { handle });
	return data.product;
}

// ---------- Cart API (unchanged below) ----------
export type CartSummary = {
	id: string;
	checkoutUrl: string;
	totalQuantity: number;
};

type CartCreateResponse = { cartCreate: { cart: CartSummary } };
export async function cartCreate(
	lines: { merchandiseId: string; quantity: number }[]
) {
	const mutation = gql/* GraphQL */ `
		mutation CartCreate($lines: [CartLineInput!]) {
			cartCreate(input: { lines: $lines }) {
				cart {
					id
					checkoutUrl
					totalQuantity
				}
			}
		}
	`;
	const data = await shopify.request<CartCreateResponse>(mutation, { lines });
	return data.cartCreate.cart;
}

type CartLinesAddResponse = { cartLinesAdd: { cart: CartSummary } };
export async function cartLinesAdd(
	cartId: string,
	lines: { merchandiseId: string; quantity: number }[]
) {
	const mutation = gql/* GraphQL */ `
		mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
			cartLinesAdd(cartId: $cartId, lines: $lines) {
				cart {
					id
					totalQuantity
					checkoutUrl
				}
			}
		}
	`;
	const data = await shopify.request<CartLinesAddResponse>(mutation, {
		cartId,
		lines,
	});
	return data.cartLinesAdd.cart;
}

export type CartLineNode = {
	id: string;
	quantity: number;
	merchandise: {
		__typename?: string;
		id: string;
		title: string;
		product: {
			title: string;
			handle: string;
			featuredImage?: { url: string } | null;
		};
		price: { amount: string; currencyCode: string };
	};
	cost: {
		amountPerQuantity: { amount: string; currencyCode: string };
		totalAmount: { amount: string; currencyCode: string };
	};
};

export type Cart = {
	id: string;
	checkoutUrl: string;
	totalQuantity: number;
	lines: { edges: Edge<CartLineNode>[] };
	cost: {
		subtotalAmount: { amount: string; currencyCode: string };
		totalAmount: { amount: string; currencyCode: string };
	};
};

type CartQueryResponse = { cart: Cart };
export async function cartQuery(cartId: string) {
	const query = gql/* GraphQL */ `
		query Cart($id: ID!) {
			cart(id: $id) {
				id
				checkoutUrl
				totalQuantity
				lines(first: 100) {
					edges {
						node {
							id
							quantity
							merchandise {
								... on ProductVariant {
									id
									title
									product {
										title
										handle
										featuredImage {
											url
										}
									}
									price {
										amount
										currencyCode
									}
								}
							}
							cost {
								amountPerQuantity {
									amount
									currencyCode
								}
								totalAmount {
									amount
									currencyCode
								}
							}
						}
					}
				}
				cost {
					subtotalAmount {
						amount
						currencyCode
					}
					totalAmount {
						amount
						currencyCode
					}
				}
			}
		}
	`;
	const data = await shopify.request<CartQueryResponse>(query, {
		id: cartId,
	});
	return data.cart;
}

type CartLinesUpdateResponse = {
	cartLinesUpdate: { cart: { id: string; totalQuantity: number } };
};
export async function cartLinesUpdate(
	cartId: string,
	lineId: string,
	quantity: number
) {
	const mutation = gql/* GraphQL */ `
		mutation Update($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
			cartLinesUpdate(cartId: $cartId, lines: $lines) {
				cart {
					id
					totalQuantity
				}
			}
		}
	`;
	const data = await shopify.request<CartLinesUpdateResponse>(mutation, {
		cartId,
		lines: [{ id: lineId, quantity }],
	});
	return data.cartLinesUpdate.cart;
}

type CartLinesRemoveResponse = {
	cartLinesRemove: { cart: { id: string; totalQuantity: number } };
};
export async function cartLinesRemove(cartId: string, lineIds: string[]) {
	const mutation = gql/* GraphQL */ `
		mutation Remove($cartId: ID!, $lineIds: [ID!]!) {
			cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
				cart {
					id
					totalQuantity
				}
			}
		}
	`;
	const data = await shopify.request<CartLinesRemoveResponse>(mutation, {
		cartId,
		lineIds,
	});
	return data.cartLinesRemove.cart;
}

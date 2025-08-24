import { NextResponse } from "next/server";
import { cartLinesUpdate, cartQuery } from "@/lib/queries";

export async function POST(req: Request) {
	const { cartId, lineId, quantity } = await req.json();
	await cartLinesUpdate(cartId, lineId, quantity);
	const cart = await cartQuery(cartId);
	return NextResponse.json(cart);
}

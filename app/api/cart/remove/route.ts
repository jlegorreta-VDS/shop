import { NextResponse } from "next/server";
import { cartLinesRemove, cartQuery } from "@/lib/queries";

export async function POST(req: Request) {
	const { cartId, lineIds } = await req.json();
	await cartLinesRemove(cartId, lineIds);
	const cart = await cartQuery(cartId);
	return NextResponse.json(cart);
}

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { cartCreate, cartLinesAdd } from "@/lib/queries";

export async function POST(req: Request) {
	const { merchandiseId, quantity = 1 } = await req.json();
  const cookieStore = cookies();
	const cartId = (await cookieStore).get("cartId")?.value;

	let cart;
	if (!cartId) {
		cart = await cartCreate([{ merchandiseId, quantity }]);
	} else {
		cart = await cartLinesAdd(cartId, [{ merchandiseId, quantity }]);
	}

	const res = NextResponse.json(cart);
	res.cookies.set("cartId", cart.id, {
		path: "/",
		httpOnly: false,
		sameSite: "lax",
	});
	return res;
}

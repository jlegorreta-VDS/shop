import { NextResponse } from "next/server";
import { cartQuery } from "@/lib/queries";

export async function GET(req: Request) {
	const { searchParams } = new URL(req.url);
	const id = searchParams.get("id");
	if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
	const cart = await cartQuery(id);
	return NextResponse.json(cart);
}

"use client";
import Link from "next/link";
import { useCart } from "@/store/cart";

export default function CartButton() {
  const qty = useCart((s) => s.totalQuantity);
  return (
    <Link href="/cart" className="relative underline">
      Cart{qty ? ` (${qty})` : ""}
    </Link>
  );
}
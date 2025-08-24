"use client";
import { create } from "zustand";

type CartState = {
  cartId?: string;
  totalQuantity: number;
  setCart: (id: string, qty: number) => void;
  clear: () => void;
};

export const useCart = create<CartState>((set) => ({
  cartId: undefined,
  totalQuantity: 0,
  setCart: (id,qty) => set({ cartId: id, totalQuantity: qty }),
  clear: () => set({ cartId: undefined, totalQuantity: 0}),
}));
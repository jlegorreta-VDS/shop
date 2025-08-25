"use client";
import { create } from "zustand";

type UIState = {
	isCartOpen: boolean;
	openCart: () => void;
	closeCart: () => void;
};

export const useUI = create<UIState>((set) => ({
	isCartOpen: false,
	openCart: () => set({ isCartOpen: true }),
	closeCart: () => set({ isCartOpen: false }),
}));

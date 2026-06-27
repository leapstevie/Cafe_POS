import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Drink, CartItem } from '../models/drink.model';

@Injectable({
    providedIn: 'root'
})
export class CartService {
    private readonly STORAGE_KEY = 'cafe_cart';
    private cartItemsSubject = new BehaviorSubject<CartItem[]>(this.loadCartFromStorage());
    private isBrowser: boolean;

    constructor(@Inject(PLATFORM_ID) private platformId: Object) {
        this.isBrowser = isPlatformBrowser(this.platformId);

        // Subscribe to cart changes and persist to localStorage
        this.cartItemsSubject.subscribe(items => {
            this.saveCartToStorage(items);
        });
    }

    /**
     * Get observable of all cart items
     */
    getCartItems(): Observable<CartItem[]> {
        return this.cartItemsSubject.asObservable();
    }

    /**
     * Get observable of total number of items in cart
     */
    getCartCount(): Observable<number> {
        return this.cartItemsSubject.pipe(
            map(items => items.reduce((total, item) => total + item.quantity, 0))
        );
    }

    /**
     * Get observable of total cart price
     */
    getCartTotal(): Observable<number> {
        return this.cartItemsSubject.pipe(
            map(items => items.reduce((total, item) => total + item.subtotal, 0))
        );
    }

    /**
     * Add a drink to the cart or increase quantity if already exists
     */
    addToCart(drink: Drink, quantity: number = 1): void {
        const currentItems = this.cartItemsSubject.value;
        const existingItemIndex = currentItems.findIndex(item => item.drink.name === drink.name);

        if (existingItemIndex > -1) {
            // Item already in cart, increase quantity
            const updatedItems = [...currentItems];
            updatedItems[existingItemIndex].quantity += quantity;
            updatedItems[existingItemIndex] = this.recalculateCartItem({
                ...updatedItems[existingItemIndex]
            });
            this.cartItemsSubject.next(updatedItems);
        } else {
            // New item, add to cart
            const newItem = this.recalculateCartItem({
                drink,
                quantity,
                subtotal: quantity * drink.price
            });
            this.cartItemsSubject.next([...currentItems, newItem]);
        }
    }

    /**
     * Update the quantity of a specific item in the cart
     */
    updateQuantity(drinkName: string, quantity: number): void {
        if (quantity < 1) {
            this.removeFromCart(drinkName);
            return;
        }

        const currentItems = this.cartItemsSubject.value;
        const updatedItems = currentItems.map(item => {
            if (item.drink.name === drinkName) {
                return this.recalculateCartItem({
                    ...item,
                    quantity
                });
            }
            return item;
        });
        this.cartItemsSubject.next(updatedItems);
    }

    applyDiscountToItems(
        drinkNames: string[],
        discountType: 'percentage' | 'fixed',
        discountValue: number
    ): void {
        const selectedDrinkNames = new Set(drinkNames);
        const updatedItems = this.cartItemsSubject.value.map(item => {
            if (!selectedDrinkNames.has(item.drink.name)) {
                return item;
            }

            return this.recalculateCartItem({
                ...item,
                discountType,
                discountValue
            });
        });

        this.cartItemsSubject.next(updatedItems);
    }

    clearDiscountFromItems(drinkNames: string[]): void {
        const selectedDrinkNames = new Set(drinkNames);
        const updatedItems = this.cartItemsSubject.value.map(item => {
            if (!selectedDrinkNames.has(item.drink.name)) {
                return item;
            }

            return this.recalculateCartItem({
                ...item,
                discountType: null,
                discountValue: 0
            });
        });

        this.cartItemsSubject.next(updatedItems);
    }

    /**
     * Remove a specific item from the cart
     */
    removeFromCart(drinkName: string): void {
        const currentItems = this.cartItemsSubject.value;
        const updatedItems = currentItems.filter(item => item.drink.name !== drinkName);
        this.cartItemsSubject.next(updatedItems);
    }

    /**
     * Clear all items from the cart
     */
    clearCart(): void {
        this.cartItemsSubject.next([]);
    }

    /**
     * Load cart from localStorage
     */
    private loadCartFromStorage(): CartItem[] {
        if (!this.isBrowser) {
            return [];
        }

        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            const parsedItems: CartItem[] = stored ? JSON.parse(stored) : [];
            return parsedItems.map(item => this.recalculateCartItem(item));
        } catch (error) {
            console.error('Error loading cart from storage:', error);
            return [];
        }
    }

    /**
     * Save cart to localStorage
     */
    private saveCartToStorage(items: CartItem[]): void {
        if (!this.isBrowser) {
            return;
        }

        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
        } catch (error) {
            console.error('Error saving cart to storage:', error);
        }
    }

    private recalculateCartItem(item: CartItem): CartItem {
        const quantity = Math.max(1, Number(item.quantity || 1));
        const baseSubtotal = quantity * Number(item.drink.price || 0);
        const discountType = item.discountType || null;
        const discountValue = Number(item.discountValue || 0);
        let discountAmount = 0;

        if (discountType === 'percentage' && discountValue > 0) {
            discountAmount = baseSubtotal * (Math.min(discountValue, 100) / 100);
        } else if (discountType === 'fixed' && discountValue > 0) {
            discountAmount = Math.min(discountValue, baseSubtotal);
        }

        discountAmount = Math.round(discountAmount * 100) / 100;

        return {
            ...item,
            quantity,
            baseSubtotal,
            discountType,
            discountValue,
            discountAmount,
            subtotal: Math.round((baseSubtotal - discountAmount) * 100) / 100
        };
    }
}

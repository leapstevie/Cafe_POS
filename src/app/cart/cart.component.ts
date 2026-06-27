import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../services/cart.service';
import { OrderService } from '../services/order.service';
import { AuthService } from '../services/auth.service';
import { TelegramMiniAppService } from '../services/telegram-mini-app.service';
import { CartItem } from '../models/drink.model';
import { Observable, take } from 'rxjs';

@Component({
    selector: 'app-cart',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './cart.component.html',
    styleUrl: './cart.component.css'
})
export class CartComponent implements OnInit {
    cartItems$!: Observable<CartItem[]>;
    cartTotal$!: Observable<number>;
    cartCount$!: Observable<number>;
    orderPlaced = false;
    isCheckingOut = false;
    checkoutError = '';
    placedInvoice = '';
    currentCartSubtotal = 0;
    showDiscountModal = false;
    discountUnit: 'percent' | 'amount' = 'percent';
    discountDraftValue = '';
    appliedDiscountType: 'percent' | 'amount' | null = null;
    appliedDiscountValue = 0;

    constructor(
        private readonly cartService: CartService,
        private readonly orderService: OrderService,
        private readonly authService: AuthService,
        private readonly router: Router,
        private readonly telegramMiniAppService: TelegramMiniAppService
    ) { }

    ngOnInit() {
        this.cartItems$ = this.cartService.getCartItems();
        this.cartTotal$ = this.cartService.getCartTotal();
        this.cartCount$ = this.cartService.getCartCount();
        this.cartTotal$.subscribe(total => {
            this.currentCartSubtotal = total;
        });
    }

    increaseQuantity(drinkName: string, currentQuantity: number) {
        this.cartService.updateQuantity(drinkName, currentQuantity + 1);
        this.telegramMiniAppService.selectionChanged();
    }

    decreaseQuantity(drinkName: string, currentQuantity: number) {
        if (currentQuantity > 1) {
            this.cartService.updateQuantity(drinkName, currentQuantity - 1);
            this.telegramMiniAppService.selectionChanged();
        }
    }

    removeItem(drinkName: string) {
        if (confirm(`Remove ${drinkName} from cart?`)) {
            this.cartService.removeFromCart(drinkName);
            this.telegramMiniAppService.notify('warning');
        }
    }

    clearCart() {
        if (confirm('Are you sure you want to clear your entire cart?')) {
            this.cartService.clearCart();
            this.clearDiscount(true);
            this.telegramMiniAppService.notify('warning');
        }
    }

    openDiscountModal() {
        this.showDiscountModal = true;
        this.discountUnit = this.appliedDiscountType || 'percent';
        this.discountDraftValue = this.appliedDiscountValue > 0 ? String(this.appliedDiscountValue) : '';
        this.checkoutError = '';
        this.telegramMiniAppService.selectionChanged();
    }

    closeDiscountModal() {
        this.showDiscountModal = false;
    }

    setDiscountUnit(unit: 'percent' | 'amount') {
        this.discountUnit = unit;
        this.telegramMiniAppService.selectionChanged();
    }

    onDiscountInput(event: Event) {
        const input = event.target as HTMLInputElement;
        this.discountDraftValue = input.value;
    }

    applyDiscount(subtotal: number) {
        const rawValue = Number(this.discountDraftValue || 0);

        if (!Number.isFinite(rawValue) || rawValue <= 0) {
            this.checkoutError = 'Enter a valid discount value.';
            return;
        }

        if (this.discountUnit === 'percent' && rawValue > 100) {
            this.checkoutError = 'Percentage discount cannot be more than 100%.';
            return;
        }

        if (this.discountUnit === 'amount' && rawValue > subtotal) {
            this.checkoutError = 'Discount cannot be more than subtotal.';
            return;
        }

        this.appliedDiscountType = this.discountUnit;
        this.appliedDiscountValue = this.roundCurrency(rawValue);
        this.checkoutError = '';
        this.telegramMiniAppService.notify('success');
        this.closeDiscountModal();
    }

    clearDiscount(silent = false) {
        this.appliedDiscountType = null;
        this.appliedDiscountValue = 0;
        this.discountDraftValue = '';
        this.discountUnit = 'percent';
        if (!silent) {
            this.telegramMiniAppService.notify('warning');
        }
    }

    hasDiscount(): boolean {
        return this.appliedDiscountType !== null && this.appliedDiscountValue > 0;
    }

    getPreviewDiscount(subtotal: number): number {
        const rawValue = Number(this.discountDraftValue || 0);

        if (!Number.isFinite(rawValue) || rawValue <= 0) {
            return 0;
        }

        if (this.discountUnit === 'percent') {
            return this.roundCurrency(subtotal * (Math.min(rawValue, 100) / 100));
        }

        return this.roundCurrency(Math.min(rawValue, subtotal));
    }

    getPreviewTotal(subtotal: number): number {
        return this.roundCurrency(Math.max(subtotal - this.getPreviewDiscount(subtotal), 0));
    }

    getAppliedDiscount(subtotal: number): number {
        if (!this.hasDiscount()) {
            return 0;
        }

        if (this.appliedDiscountType === 'percent') {
            return this.roundCurrency(subtotal * (this.appliedDiscountValue / 100));
        }

        return this.roundCurrency(Math.min(this.appliedDiscountValue, subtotal));
    }

    getDiscountDisplayValue(): string {
        if (!this.hasDiscount()) {
            return '';
        }

        if (this.appliedDiscountType === 'percent') {
            return `${this.appliedDiscountValue}%`;
        }

        return `$${this.appliedDiscountValue.toFixed(2)}`;
    }

    getFinalTotal(subtotal: number): number {
        return this.roundCurrency(Math.max(subtotal - this.getAppliedDiscount(subtotal), 0));
    }

    private roundCurrency(value: number): number {
        return Math.round(value * 100) / 100;
    }

    checkout() {
        this.isCheckingOut = true;
        this.checkoutError = '';
        this.telegramMiniAppService.impact('medium');

        this.cartItems$.pipe(take(1)).subscribe(items => {
            this.cartTotal$.pipe(take(1)).subscribe(subtotal => {
                const discountAmount = this.getAppliedDiscount(subtotal);
                const total = this.getFinalTotal(subtotal);
                const cashierName = this.authService.currentUserValue?.username || 'Guest';
                const payload = {
                    subtotal: +subtotal.toFixed(2),
                    total: +total.toFixed(2),
                    cashier_name: cashierName,
                    discount_type: this.hasDiscount()
                        ? (this.appliedDiscountType === 'percent' ? 'percentage' as const : 'fixed' as const)
                        : null,
                    discount_value: this.hasDiscount() ? +this.appliedDiscountValue.toFixed(2) : 0,
                    discount_amount: +discountAmount.toFixed(2),
                    items: items.map(i => ({
                        item_id: i.drink.id ?? null,
                        item_name: i.drink.name,
                        quantity: i.quantity,
                        subtotal: +i.subtotal.toFixed(2)
                    }))
                };

                this.orderService.createOrder(payload).subscribe({
                    next: (res) => {
                        this.placedInvoice = res.order.invoice_number;
                        this.orderPlaced = true;
                        this.isCheckingOut = false;
                        this.telegramMiniAppService.notify('success');
                        this.clearDiscount(true);
                        this.cartService.clearCart();
                    },
                    error: (err) => {
                        this.checkoutError = err.message || 'Failed to place order. Please try again.';
                        this.isCheckingOut = false;
                        this.telegramMiniAppService.notify('error');
                    }
                });
            });
        });
    }

    continueShopping() {
        this.orderPlaced = false;
        this.telegramMiniAppService.selectionChanged();
        this.router.navigate(['/menu']);
    }
}

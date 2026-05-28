import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../services/cart.service';
import { OrderService } from '../services/order.service';
import { AuthService } from '../services/auth.service';
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

    constructor(
        private readonly cartService: CartService,
        private readonly orderService: OrderService,
        private readonly authService: AuthService,
        private readonly router: Router
    ) { }

    ngOnInit() {
        this.cartItems$ = this.cartService.getCartItems();
        this.cartTotal$ = this.cartService.getCartTotal();
        this.cartCount$ = this.cartService.getCartCount();
    }

    increaseQuantity(drinkName: string, currentQuantity: number) {
        this.cartService.updateQuantity(drinkName, currentQuantity + 1);
    }

    decreaseQuantity(drinkName: string, currentQuantity: number) {
        if (currentQuantity > 1) {
            this.cartService.updateQuantity(drinkName, currentQuantity - 1);
        }
    }

    removeItem(drinkName: string) {
        if (confirm(`Remove ${drinkName} from cart?`)) {
            this.cartService.removeFromCart(drinkName);
        }
    }

    clearCart() {
        if (confirm('Are you sure you want to clear your entire cart?')) {
            this.cartService.clearCart();
        }
    }

    checkout() {
        this.isCheckingOut = true;
        this.checkoutError = '';

        this.cartItems$.pipe(take(1)).subscribe(items => {
            this.cartTotal$.pipe(take(1)).subscribe(total => {
                const cashierName = this.authService.currentUserValue?.username || 'Guest';
                const payload = {
                    total: +total.toFixed(2),
                    cashier_name: cashierName,
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
                        this.cartService.clearCart();
                    },
                    error: (err) => {
                        this.checkoutError = err.message || 'Failed to place order. Please try again.';
                        this.isCheckingOut = false;
                    }
                });
            });
        });
    }

    continueShopping() {
        this.orderPlaced = false;
        this.router.navigate(['/menu']);
    }
}

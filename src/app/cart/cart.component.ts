import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../services/cart.service';
import { CartItem } from '../models/drink.model';
import { Observable } from 'rxjs';

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

    constructor(
        private cartService: CartService,
        private router: Router
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
        this.orderPlaced = true;
        this.cartService.clearCart();
    }

    continueShopping() {
        this.orderPlaced = false;
        this.router.navigate(['/menu']);
    }
}

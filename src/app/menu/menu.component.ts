import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { Drink, CartItem } from '../models/drink.model';
import { CartService } from '../services/cart.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.css'
})
export class MenuComponent implements OnInit {
  private readonly API_URL = environment.apiUrl;

  searchQuery: string = '';
  selectedCategory: string = 'All';
  drinks: Drink[] = [];
  isLoading = false;
  errorMessage = '';
  categories: string[] = ['All'];

  cartItems$: Observable<CartItem[]>;
  cartTotal$: Observable<number>;

  constructor(
    private cartService: CartService,
    private http: HttpClient,
    private router: Router
  ) {
    this.cartItems$ = this.cartService.getCartItems();
    this.cartTotal$ = this.cartService.getCartTotal();
  }

  ngOnInit(): void {
    this.loadMenuItems();
  }

  loadMenuItems(): void {
    this.isLoading = true;
    this.http.get<Drink[]>(`${this.API_URL}/items`).subscribe({
      next: (items) => {
        this.drinks = items;
        this.generateCategories();
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Failed to load menu items';
        this.isLoading = false;
        console.error('Error loading menu:', error);
      }
    });
  }

  generateCategories(): void {
    const categoriesFromItems = this.drinks
      .map(drink => drink.category)
      .filter((cat): cat is string => !!cat);

    const uniqueCategories = new Set(categoriesFromItems);
    this.categories = ['All', ...Array.from(uniqueCategories).sort()];
  }

  get filteredDrinks(): Drink[] {
    return this.drinks.filter(drink => {
      const matchesSearch = drink.name.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchesCategory = this.selectedCategory === 'All' || drink.category === this.selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }

  setCategory(category: string) {
    this.selectedCategory = category;
  }

  addToCart(drink: Drink) {
    this.cartService.addToCart(drink, 1);
  }

  increaseQuantity(itemName: string, currentQuantity: number): void {
    this.cartService.updateQuantity(itemName, currentQuantity + 1);
  }

  decreaseQuantity(itemName: string, currentQuantity: number): void {
    if (currentQuantity > 1) {
      this.cartService.updateQuantity(itemName, currentQuantity - 1);
    } else {
      this.removeItem(itemName);
    }
  }

  removeItem(itemName: string): void {
    this.cartService.removeFromCart(itemName);
  }

  clearCart(): void {
    this.cartService.clearCart();
  }

  checkout(): void {
    this.router.navigate(['/cart']);
  }
}

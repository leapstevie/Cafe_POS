import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { Drink, CartItem } from '../models/drink.model';
import { CartService } from '../services/cart.service';
import { TelegramMiniAppService } from '../services/telegram-mini-app.service';
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
  currentCartItems: CartItem[] = [];
  showItemDiscountModal = false;
  selectedDiscountItemNames: string[] = [];
  discountUnit: 'percentage' | 'fixed' = 'percentage';
  discountValue = '';
  discountError = '';

  cartItems$: Observable<CartItem[]>;
  cartTotal$: Observable<number>;

  constructor(
    private cartService: CartService,
    private http: HttpClient,
    private router: Router,
    private telegramMiniAppService: TelegramMiniAppService
  ) {
    this.cartItems$ = this.cartService.getCartItems();
    this.cartTotal$ = this.cartService.getCartTotal();
  }

  ngOnInit(): void {
    this.loadMenuItems();
    this.cartItems$.subscribe(items => {
      this.currentCartItems = items;
      this.selectedDiscountItemNames = this.selectedDiscountItemNames.filter(name =>
        items.some(item => item.drink.name === name)
      );
    });
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
    this.telegramMiniAppService.impact('rigid');
  }

  openItemDiscountModal(): void {
    if (this.currentCartItems.length === 0) {
      return;
    }

    this.showItemDiscountModal = true;
    this.discountError = '';
    this.selectedDiscountItemNames = [];
    this.discountUnit = 'percentage';
    this.discountValue = '';
    this.telegramMiniAppService.selectionChanged();
  }

  closeItemDiscountModal(): void {
    this.showItemDiscountModal = false;
    this.discountError = '';
  }

  toggleDiscountItem(itemName: string): void {
    if (this.selectedDiscountItemNames.includes(itemName)) {
      this.selectedDiscountItemNames = this.selectedDiscountItemNames.filter(name => name !== itemName);
      this.telegramMiniAppService.selectionChanged();
      return;
    }

    this.selectedDiscountItemNames = [...this.selectedDiscountItemNames, itemName];
    this.telegramMiniAppService.selectionChanged();
  }

  setDiscountUnit(unit: 'percentage' | 'fixed'): void {
    this.discountUnit = unit;
    this.telegramMiniAppService.selectionChanged();
  }

  onDiscountValueChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.discountValue = input.value;
  }

  applyDiscountToSelectedItems(): void {
    const parsedValue = Number(this.discountValue || 0);
    const selectedItems = this.currentCartItems.filter(item =>
      this.selectedDiscountItemNames.includes(item.drink.name)
    );

    if (selectedItems.length === 0) {
      this.discountError = 'Select at least one item.';
      return;
    }

    if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
      this.discountError = 'Enter a valid discount value.';
      return;
    }

    if (this.discountUnit === 'percentage' && parsedValue > 100) {
      this.discountError = 'Percentage discount cannot be more than 100%.';
      return;
    }

    const highestBaseSubtotal = Math.max(...selectedItems.map(item => item.baseSubtotal || item.subtotal));
    if (this.discountUnit === 'fixed' && parsedValue > highestBaseSubtotal) {
      this.discountError = 'Fixed discount cannot be greater than the selected item price.';
      return;
    }

    this.cartService.applyDiscountToItems(
      this.selectedDiscountItemNames,
      this.discountUnit,
      this.roundCurrency(parsedValue)
    );

    this.telegramMiniAppService.notify('success');
    this.closeItemDiscountModal();
  }

  clearDiscountFromSelectedItems(): void {
    if (this.selectedDiscountItemNames.length === 0) {
      this.discountError = 'Select at least one item.';
      return;
    }

    this.cartService.clearDiscountFromItems(this.selectedDiscountItemNames);
    this.telegramMiniAppService.notify('warning');
    this.closeItemDiscountModal();
  }

  hasItemDiscount(item: CartItem): boolean {
    return Number(item.discountAmount || 0) > 0;
  }

  getItemDiscountLabel(item: CartItem): string {
    if (!this.hasItemDiscount(item)) {
      return '';
    }

    if (item.discountType === 'percentage') {
      return `${item.discountValue}% off`;
    }

    return `-$${Number(item.discountAmount || 0).toFixed(2)}`;
  }

  getItemOriginalSubtotal(item: CartItem): number {
    return Number(item.baseSubtotal || item.subtotal || 0);
  }

  isDiscountItemSelected(itemName: string): boolean {
    return this.selectedDiscountItemNames.includes(itemName);
  }

  private roundCurrency(value: number): number {
    return Math.round(value * 100) / 100;
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
    this.telegramMiniAppService.notify('warning');
  }

  checkout(): void {
    this.telegramMiniAppService.impact('heavy');
    this.router.navigate(['/cart']);
  }
}

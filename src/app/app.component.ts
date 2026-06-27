import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { CartService } from './services/cart.service';
import { AuthService } from './services/auth.service';
import { TelegramMiniAppService } from './services/telegram-mini-app.service';
import { Observable } from 'rxjs';
import { User } from './models/user.model';
import { MobileMenuComponent } from './components/mobile-menu/mobile-menu.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, MatBottomSheetModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'cafe';
  cartCount$: Observable<number>;
  currentUser$: Observable<User | null>;
  isUserAdmin$: Observable<boolean> = new Observable<boolean>();

  constructor(
    private cartService: CartService,
    private authService: AuthService,
    private bottomSheet: MatBottomSheet,
    private telegramMiniAppService: TelegramMiniAppService
  ) {
    this.cartCount$ = this.cartService.getCartCount();
    this.currentUser$ = this.authService.currentUser$;
  }

  ngOnInit(): void {
    this.telegramMiniAppService.initialize();

    // Force re-check of auth state after client hydration
    // This ensures the UI updates with localStorage data
    if (this.authService.isLoggedIn() && !this.authService.currentUserValue) {
      // Token exists but user not loaded - reload from storage
      this.authService.reloadUserFromStorage();
    }
  }

  showAdminLink(): boolean {
    return this.authService.isAdmin();
  }

  logout(): void {
    this.telegramMiniAppService.notify('warning');
    this.authService.logout();
  }

  openMobileMenu(): void {
    this.telegramMiniAppService.impact('medium');
    this.bottomSheet.open(MobileMenuComponent);
  }
}

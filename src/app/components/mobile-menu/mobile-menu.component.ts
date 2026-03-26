import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { AuthService } from '../../services/auth.service';
import { Observable } from 'rxjs';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-mobile-menu',
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './mobile-menu.component.html',
  styleUrl: './mobile-menu.component.css'
})
export class MobileMenuComponent {
  currentUser$: Observable<User | null>;

  constructor(
    private bottomSheetRef: MatBottomSheetRef<MobileMenuComponent>,
    private authService: AuthService
  ) {
    this.currentUser$ = this.authService.currentUser$;
  }

  showAdminLink(): boolean {
    return this.authService.isAdmin();
  }

  logout(event: MouseEvent): void {
    event.preventDefault();
    this.authService.logout();
    this.closeMenu();
  }

  closeMenu(): void {
    this.bottomSheetRef.dismiss();
  }
}

import { Routes } from '@angular/router';
import { MenuComponent } from './menu/menu.component';
import { CartComponent } from './cart/cart.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { AdminControlComponent } from './components/admin-control/admin-control.component';
import { CategoryManagementComponent } from './components/category-management/category-management.component';
import { OrderHistoryComponent } from './components/order-history/order-history.component';
import { adminGuard } from './guards/admin.guard';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'menu', component: MenuComponent, canActivate: [authGuard] },
  { path: 'cart', component: CartComponent, canActivate: [authGuard] },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent, canActivate: [adminGuard] },
  { path: 'admin', component: AdminControlComponent, canActivate: [adminGuard] },
  { path: 'admin/categories', component: CategoryManagementComponent, canActivate: [adminGuard] },
  { path: 'admin/orders', component: OrderHistoryComponent, canActivate: [adminGuard] },
  { path: '**', redirectTo: '' }
];

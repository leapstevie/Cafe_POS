import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { MenuComponent } from './menu/menu.component';
import { ContactComponent } from './contact/contact.component';
import { CartComponent } from './cart/cart.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { AdminControlComponent } from './components/admin-control/admin-control.component';
import { CategoryManagementComponent } from './components/category-management/category-management.component';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'menu', component: MenuComponent },
  // { path: 'contact', component: ContactComponent },
  { path: 'cart', component: CartComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'admin', component: AdminControlComponent, canActivate: [adminGuard] },
  { path: 'admin/categories', component: CategoryManagementComponent, canActivate: [adminGuard] },
  { path: '**', redirectTo: '' }
];

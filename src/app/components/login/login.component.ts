import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TelegramMiniAppService } from '../../services/telegram-mini-app.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  readonly testerAccounts = [
    { label: 'Admin Tester', email: 'admin@gmail.com', password: 'admin123' },
    { label: 'Cashier Tester', email: 'cashier1@gmail.com', password: 'cashier123' }
  ];
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';

  // Telegram Mini App: no password form — auto-login as admin, or gate everyone else to the web app
  isTelegramContext = false;
  isCheckingTelegramAuth = false;
  telegramAuthFailed = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private telegramMiniAppService: TelegramMiniAppService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['cashier1@gmail.com', [Validators.required, Validators.email]],
      password: ['cashier123', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    this.isTelegramContext = this.telegramMiniAppService.isInTelegramMiniApp();
    if (this.isTelegramContext) {
      this.attemptTelegramLogin();
    }
  }

  private attemptTelegramLogin(): void {
    const initData = this.telegramMiniAppService.getRawInitData();
    if (!initData) {
      this.telegramAuthFailed = true;
      return;
    }

    this.isCheckingTelegramAuth = true;
    this.authService.telegramLogin(initData).subscribe({
      next: () => this.router.navigate(['/admin']),
      error: () => {
        this.isCheckingTelegramAuth = false;
        this.telegramAuthFailed = true;
      }
    });
  }

  openOnWeb(): void {
    this.telegramMiniAppService.openExternalLink(window.location.href);
  }

  fillTesterAccount(email: string, password: string): void {
    this.loginForm.patchValue({ email, password });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.loginForm.value).subscribe({
      next: (response) => {
        console.log('Login successful:', response);
        this.router.navigate(['/menu']);
      },
      error: (error) => {
        this.errorMessage = error.message || 'Login failed. Please try again.';
        this.isLoading = false;
      }
    });
  }

  get emailControl() {
    return this.loginForm.controls['email'];
  }

  get passwordControl() {
    return this.loginForm.controls['password'];
  }
}

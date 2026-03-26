import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Drink } from '../../models/drink.model';
import { CategoryService } from '../../services/category.service';
import { Category } from '../../models/category.model';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-admin-control',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './admin-control.component.html',
  styleUrl: './admin-control.component.css'
})
export class AdminControlComponent implements OnInit {

  private readonly API_URL = environment.apiUrl;

  items           : Drink[] = [];
  itemForm        : FormGroup;
  isLoading       : boolean = false;

  errorMessage    : string = '';
  successMessage  : string = '';

  isEditing       : boolean = false;
  editingItemId   : number | null = null;
  showForm        : boolean = false;

  imagePreview    : string | null = null;
  selectedFile    : File | null = null;
  categories      : Category[] = [];

  constructor(
    private fb        : FormBuilder,
    private http      : HttpClient,
    private categoryService: CategoryService
  ) {
    this.itemForm = this.fb.group({
      name:        ['', Validators.required],
      category_id: ['', Validators.required],
      description: ['', Validators.required],
      price:       ['', [Validators.required, Validators.min(0.01)]],
      temperature: ['Hot', Validators.required],
      image:       ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadItems();
    this.loadCategories();
  }

  loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (data) => {
        this.categories = data;
      },
      error: (err) => {
        console.error('Error loading categories:', err);
      }
    });
  }

  /**
   * Load all items from API
   */
  loadItems(): void {
    this.isLoading = true;

    this.http.get<Drink[]>(`${this.API_URL}/items`).subscribe({
      next: (items) => {
        this.items = items;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Failed to load items';
        this.isLoading = false;
        console.error('Error loading items:', error);
      }
    });
  }

  /**
   * Handle file selection
   */
  onFileSelected(event: any): void {
    const file = event.target.files[0];

    if (file) {
      this.selectedFile = file;

      // Create image preview
      const reader = new FileReader();

      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;

        // Set the base64 string to the form
        this.itemForm.patchValue({ image: e.target.result });
      };

      reader.readAsDataURL(file);
    }
  }

  /**
   * Show form for adding new item
   */
  showAddForm(): void {
    this.isEditing = false;
    this.editingItemId = null;
    this.imagePreview = null;
    this.selectedFile = null;

    this.itemForm.reset({
      temperature: 'Hot'
    });

    this.showForm = true;
  }

  /**
   * Show form for editing existing item
   */
  editItem(item: any): void {
    this.isEditing = true;
    this.editingItemId = item.id;
    this.imagePreview = item.image;

    this.itemForm.patchValue({
      name: item.name,
      category_id: item.category_id,
      description: item.description,
      price: item.price,
      temperature: item.temperature,
      image: item.image
    });

    this.showForm = true;
  }

  /**
   * Cancel form
   */
  cancelForm(): void {
    this.showForm = false;
    this.isEditing = false;
    this.editingItemId = null;
    this.imagePreview = null;
    this.selectedFile = null;

    this.itemForm.reset();
  }

  /**
   * Submit form (create or update)
   */
  onSubmit(): void {
    if (this.itemForm.invalid) {
      this.itemForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const itemData = this.itemForm.value;

    if (this.isEditing && this.editingItemId) {
      // Update existing item
      this.http.put(`${this.API_URL}/items/${this.editingItemId}`, itemData).subscribe({
        next: () => {
          this.successMessage = 'Item updated successfully!';
          this.loadItems();
          this.cancelForm();
          this.isLoading = false;

          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (error) => {
          this.errorMessage = error.message || 'Failed to update item';
          this.isLoading = false;
        }
      });
    } else {
      // Create new item
      this.http.post(`${this.API_URL}/items`, itemData).subscribe({
        next: () => {
          this.successMessage = 'Item created successfully!';
          this.loadItems();
          this.cancelForm();
          this.isLoading = false;

          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (error) => {
          this.errorMessage = error.message || 'Failed to create item';
          this.isLoading = false;
        }
      });
    }
  }

  /**
   * Delete item
   */
  deleteItem(itemId: number, itemName: string): void {
    if (!confirm(`Are you sure you want to delete "${itemName}"?`)) {
      return;
    }

    this.isLoading = true;

    this.http.delete(`${this.API_URL}/items/${itemId}`).subscribe({
      next: () => {
        this.successMessage = 'Item deleted successfully!';
        this.loadItems();

        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        this.errorMessage = error.message || 'Failed to delete item';
        this.isLoading = false;
      }
    });
  }

}

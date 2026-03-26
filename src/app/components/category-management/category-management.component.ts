import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CategoryService } from '../../services/category.service';
import { Category } from '../../models/category.model';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-category-management',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './category-management.component.html',
    styleUrl: './category-management.component.css'
})
export class CategoryManagementComponent implements OnInit {
    categories      : Category[] = [];
    categoryForm    : FormGroup;
    isLoading       : boolean = false;
    isEditing       : boolean = false;
    editingCategoryId: number | null = null;
    errorMessage    : string = '';
    successMessage  : string = '';
    showForm        : boolean = false;

    constructor(
        private fb: FormBuilder,
        private categoryService: CategoryService
    ) {
        this.categoryForm = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(2)]],
            description: ['']
        });
    }

    ngOnInit(): void {
        this.loadCategories();
    }

    loadCategories(): void {
        this.isLoading = true;
        this.categoryService.getCategories().subscribe({
            next: (data) => {
                this.categories = data;
                this.isLoading = false;
            },
            error: (err) => {
                this.errorMessage = 'Failed to load categories';
                this.isLoading = false;
            }
        });
    }

    showAddForm(): void {
        this.isEditing = false;
        this.editingCategoryId = null;
        this.categoryForm.reset();
        this.showForm = true;
    }

    editCategory(category: Category): void {
        this.isEditing = true;
        this.editingCategoryId = category.id!;
        this.categoryForm.patchValue({
            name: category.name,
            description: category.description
        });
        this.showForm = true;
    }

    cancelForm(): void {
        this.showForm = false;
        this.categoryForm.reset();
    }

    onSubmit(): void {
        if (this.categoryForm.invalid) return;

        this.isLoading = true;
        const categoryData: Category = this.categoryForm.value;

        if (this.isEditing && this.editingCategoryId) {
            this.categoryService.updateCategory(this.editingCategoryId, categoryData).subscribe({
                next: () => {
                    this.successMessage = 'Category updated successfully';
                    this.loadCategories();
                    this.cancelForm();
                    setTimeout(() => this.successMessage = '', 3000);
                },
                error: (err) => {
                    this.errorMessage = err.error?.error || 'Failed to update category';
                    this.isLoading = false;
                }
            });
        } else {
            this.categoryService.createCategory(categoryData).subscribe({
                next: () => {
                    this.successMessage = 'Category created successfully';
                    this.loadCategories();
                    this.cancelForm();
                    setTimeout(() => this.successMessage = '', 3000);
                },
                error: (err) => {
                    this.errorMessage = err.error?.error || 'Failed to create category';
                    this.isLoading = false;
                }
            });
        }
    }

    deleteCategory(id: number, name: string): void {
        if (confirm(`Are you sure you want to delete category "${name}"?`)) {
            this.isLoading = true;
            this.categoryService.deleteCategory(id).subscribe({
                next: () => {
                    this.successMessage = 'Category deleted successfully';
                    this.loadCategories();
                    setTimeout(() => this.successMessage = '', 3000);
                },
                error: (err) => {
                    this.errorMessage = err.error?.error || 'Failed to delete category';
                    this.isLoading = false;
                }
            });
        }
    }
}

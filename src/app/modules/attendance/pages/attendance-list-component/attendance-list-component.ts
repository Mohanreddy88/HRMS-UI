import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceService } from '../../../../core/services/attendance.service';
import { EmployeeService } from '../../../../core/services/employee.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { Attendance } from '../../../../core/models/attendance.model';
import { ConfirmModalComponent } from '../../../../shared/components/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-attendance-list-component',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmModalComponent],
  templateUrl: './attendance-list-component.html',
  styleUrl: './attendance-list-component.scss'
})
export class AttendanceListComponent implements OnInit {
  attendance: Attendance[] = [];
  allAttendance: Attendance[] = [];
  employees: any[] = [];
  loading = false;
  errorMessage = '';
  isAdmin = false;

  // Confirmation modal state
  showConfirmModal = false;
  confirmModalTitle = '';
  confirmModalMessage = '';
  confirmModalVariant: 'danger' | 'warning' | 'info' = 'danger';
  pendingDeleteId: number | null = null;

  // Filters
  selectedEmployeeId: number | null = null;
  selectedMonth: number = new Date().getMonth() + 1;
  selectedYear: number = new Date().getFullYear();
  years: number[] = [];

  constructor(
    private attendanceService: AttendanceService,
    private employeeService: EmployeeService,
    private authService: AuthService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef
  ) {
    // Generate years from 2020 to current + 1
    const currentYear = new Date().getFullYear();
    for (let year = 2020; year <= currentYear + 1; year++) {
      this.years.push(year);
    }
  }

  ngOnInit(): void {
    this.isAdmin = this.authService.isAdmin();
    this.loadEmployees();
    this.loadAttendance();
  }

  loadEmployees(): void {
    this.employeeService.getAll().subscribe({
      next: (data: any[]) => {
        this.employees = data.filter(e => e.isActive);
        this.cdr.detectChanges();
      },
      error: () => {
        this.toast.error('Error', 'Failed to load employees');
      }
    });
  }

  loadAttendance(): void {
    this.loading = true;
    this.attendanceService.getAll().subscribe({
      next: (data) => {
        this.allAttendance = data;
        this.applyFilters();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'Failed to load attendance.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.allAttendance];

    // Filter by employee
    if (this.selectedEmployeeId) {
      filtered = filtered.filter(a => a.employeeId === this.selectedEmployeeId);
    }

    // Filter by month and year
    filtered = filtered.filter(a => {
      const date = new Date(a.date);
      return date.getMonth() + 1 === this.selectedMonth && date.getFullYear() === this.selectedYear;
    });

    this.attendance = filtered;
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  clearFilters(): void {
    this.selectedEmployeeId = null;
    this.selectedMonth = new Date().getMonth() + 1;
    this.selectedYear = new Date().getFullYear();
    this.applyFilters();
  }

  deleteAttendance(id: number): void {
    this.pendingDeleteId = id;
    this.confirmModalTitle = 'Delete Attendance';
    this.confirmModalMessage = 'Are you sure you want to remove this attendance record? This action cannot be undone.';
    this.confirmModalVariant = 'danger';
    this.showConfirmModal = true;
  }

  onConfirmDelete(): void {
    if (!this.pendingDeleteId) return;
    this.attendanceService.delete(this.pendingDeleteId).subscribe({
      next: () => {
        this.toast.success('Deleted', 'Attendance record removed.');
        this.pendingDeleteId = null;
        this.loadAttendance();
      },
      error: () => {
        this.toast.error('Delete Failed', 'Could not delete attendance record.');
        this.pendingDeleteId = null;
      }
    });
  }

  onCancelDelete(): void {
    this.pendingDeleteId = null;
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      'Present': 'present', 'Absent': 'absent', 'Leave': 'leave', 'Holiday': 'holiday', 'HalfDay': 'leave'
    };
    return map[status] ?? '';
  }

  getMonthName(month: number): string {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month - 1];
  }
}

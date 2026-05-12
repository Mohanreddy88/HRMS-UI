import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LeaveService } from '../../../../core/services/leave.service';
import { EmployeeService } from '../../../../core/services/employee.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';

interface LeaveType {
  id: number;
  name: string;
  code: string;
  defaultDaysPerYear: number;
}

interface Employee {
  id: number;
  name: string;
}

@Component({
  selector: 'app-leave-request-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './leave-request-form-component.html',
  styleUrls: ['./leave-request-form-component.scss']
})
export class LeaveRequestFormComponent implements OnInit {
  leaveTypes: LeaveType[] = [];
  employees: Employee[] = [];
  
  employeeId: number | null = null;
  leaveTypeId: number | null = null;
  startDate = '';
  endDate = '';
  reason = '';
  
  loading = false;
  isAdmin = false;
  totalDays = 0;

  constructor(
    private leaveService: LeaveService,
    private employeeService: EmployeeService,
    private authService: AuthService,
    private router: Router,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.authService.getRole() === 'Admin';
    
    // For non-admin users, employeeId will be set when they select from dropdown
    // or we can require them to select themselves if we have the employee list
    
    this.loadLeaveTypes();
    
    if (this.isAdmin) {
      this.loadEmployees();
    } else {
      // Load employees for regular users too, so they can select themselves
      this.loadEmployees();
    }
  }

  loadLeaveTypes(): void {
    this.leaveService.getLeaveTypes().subscribe({
      next: (data: any) => {
        this.leaveTypes = data;
      },
      error: (err: any) => {
        console.error('Error loading leave types:', err);
        this.toast.error('Load Failed', 'Failed to load leave types');
      }
    });
  }

  loadEmployees(): void {
    this.employeeService.getActive().subscribe({
      next: (data: any) => {
        this.employees = data;
      },
      error: (err: any) => {
        console.error('Error loading employees:', err);
        this.toast.error('Load Failed', 'Failed to load employees');
      }
    });
  }

  onDateChange(): void {
    if (this.startDate && this.endDate) {
      const start = new Date(this.startDate);
      const end = new Date(this.endDate);
      
      if (end >= start) {
        const diffTime = Math.abs(end.getTime() - start.getTime());
        this.totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      } else {
        this.totalDays = 0;
      }
    }
  }

  submitRequest(): void {
    if (!this.employeeId || !this.leaveTypeId || !this.startDate || !this.endDate || !this.reason.trim()) {
      this.toast.warning('Required Fields', 'Please fill all required fields');
      return;
    }

    if (new Date(this.endDate) < new Date(this.startDate)) {
      this.toast.warning('Invalid Dates', 'End date cannot be before start date');
      return;
    }

    // Prevent duplicate submissions
    if (this.loading) {
      return;
    }

    this.loading = true;

    const request = {
      employeeId: this.employeeId,
      leaveTypeId: this.leaveTypeId,
      startDate: this.startDate,
      endDate: this.endDate,
      reason: this.reason.trim()
    };

    console.log('Submitting leave request:', request);
    
    this.leaveService.createRequest(request).subscribe({
      next: (response) => {
        console.log('Leave request created successfully:', response);
        this.toast.success('Request Submitted', 'Leave request submitted successfully!');
        this.router.navigate(['/leave/requests']);
      },
      error: (err: any) => {
        console.error('Error submitting leave request:', err);
        console.error('Full error object:', err);
        console.error('Error status:', err.status);
        console.error('Error message:', err.error?.message || err.message);
        
        let errorMessage = 'Failed to submit leave request';
        
        if (err.error?.message) {
          errorMessage = err.error.message;
        } else if (err.status === 400) {
          errorMessage = 'Invalid request. Please check all fields and try again.';
        } else if (err.status === 404) {
          errorMessage = 'Employee or leave type not found.';
        } else if (err.status === 401) {
          errorMessage = 'You are not authorized to create leave requests.';
        }
        
        this.toast.error('Submit Failed', errorMessage);
        this.loading = false;
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/leave/requests']);
  }
}

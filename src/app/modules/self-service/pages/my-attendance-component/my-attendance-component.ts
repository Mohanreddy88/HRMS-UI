import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SelfServiceService, AttendanceResponse } from '../../../../core/services/self-service.service';
import { LoadingService } from '../../../../core/services/loading.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-my-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './my-attendance-component.html',
  styleUrl: './my-attendance-component.scss'
})
export class MyAttendanceComponent implements OnInit {
  attendanceData: AttendanceResponse | null = null;
  startDate: string = '';
  endDate: string = '';

  constructor(
    private selfServiceService: SelfServiceService,
    private loadingService: LoadingService,
    private toast: ToastService
  ) {
    // Set default to current month
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    this.startDate = this.formatDate(firstDay);
    this.endDate = this.formatDate(today);
  }

  ngOnInit(): void {
    this.loadAttendance();
  }

  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  loadAttendance(): void {
    this.loadingService.show();
    this.selfServiceService.getMyAttendance(this.startDate, this.endDate)
      .subscribe({
        next: (data) => {
          this.attendanceData = data;
          this.loadingService.hide();
        },
        error: (error) => {
          console.error('Error loading attendance:', error);
          this.loadingService.hide();
          this.toast.error('Failed to Load Attendance', error.error?.message || 'Please try again.');
        }
      });
  }

  onDateRangeChange(): void {
    this.loadAttendance();
  }

  getStatusClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'Present': 'status-present',
      'Absent': 'status-absent',
      'Leave': 'status-leave',
      'HalfDay': 'status-halfday'
    };
    return statusMap[status] || '';
  }

  getStatusIcon(status: string): string {
    const iconMap: { [key: string]: string } = {
      'Present': 'bi-check-circle-fill',
      'Absent': 'bi-x-circle-fill',
      'Leave': 'bi-calendar-x-fill',
      'HalfDay': 'bi-clock-fill'
    };
    return iconMap[status] || 'bi-question-circle-fill';
  }

  setQuickRange(range: string): void {
    const today = new Date();
    let start: Date;
    let end: Date = today;

    switch (range) {
      case 'thisWeek':
        start = new Date(today.setDate(today.getDate() - today.getDay()));
        break;
      case 'lastWeek':
        start = new Date(today.setDate(today.getDate() - today.getDay() - 7));
        end = new Date(today.setDate(today.getDate() + 6));
        break;
      case 'thisMonth':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = new Date();
        break;
      case 'lastMonth':
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        end = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      default:
        return;
    }

    this.startDate = this.formatDate(start);
    this.endDate = this.formatDate(end);
    this.loadAttendance();
  }
}

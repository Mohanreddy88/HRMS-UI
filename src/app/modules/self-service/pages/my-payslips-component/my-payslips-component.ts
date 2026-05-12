import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SelfServiceService, Payslip } from '../../../../core/services/self-service.service';
import { LoadingService } from '../../../../core/services/loading.service';
import { PayrollService } from '../../../../core/services/payroll.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-my-payslips',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './my-payslips-component.html',
  styleUrl: './my-payslips-component.scss'
})
export class MyPayslipsComponent implements OnInit {
  payslips: Payslip[] = [];
  selectedYear: number = new Date().getFullYear();
  selectedMonth: number | null = null;
  years: number[] = [];
  months = [
    { value: null, name: 'All Months' },
    { value: 1, name: 'January' },
    { value: 2, name: 'February' },
    { value: 3, name: 'March' },
    { value: 4, name: 'April' },
    { value: 5, name: 'May' },
    { value: 6, name: 'June' },
    { value: 7, name: 'July' },
    { value: 8, name: 'August' },
    { value: 9, name: 'September' },
    { value: 10, name: 'October' },
    { value: 11, name: 'November' },
    { value: 12, name: 'December' }
  ];

  constructor(
    private selfServiceService: SelfServiceService,
    private payrollService: PayrollService,
    private loadingService: LoadingService,
    private toast: ToastService
  ) {
    // Generate last 5 years
    const currentYear = new Date().getFullYear();
    for (let i = 0; i < 5; i++) {
      this.years.push(currentYear - i);
    }
  }

  ngOnInit(): void {
    this.loadPayslips();
  }

  loadPayslips(): void {
    this.loadingService.show();
    this.selfServiceService.getMyPayslips(this.selectedYear, this.selectedMonth || undefined)
      .subscribe({
        next: (data) => {
          this.payslips = data;
          this.loadingService.hide();
        },
        error: (error) => {
          console.error('Error loading payslips:', error);
          this.loadingService.hide();
          this.toast.error('Failed to Load Payslips', error.error?.message || 'Please try again.');
        }
      });
  }

  onFilterChange(): void {
    this.loadPayslips();
  }

  downloadPayslip(payslipId: number, monthName: string): void {
    this.loadingService.show();
    this.payrollService.downloadPayslipPdf(payslipId).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Payslip_${monthName.replace(' ', '_')}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.loadingService.hide();
        this.toast.success('Download Started', 'Your payslip PDF is downloading...');
      },
      error: (error: any) => {
        console.error('Error downloading payslip:', error);
        this.loadingService.hide();
        this.toast.error('Download Failed', 'Failed to download payslip. Please try again.');
      }
    });
  }

  emailPayslip(payslipId: number): void {
    this.loadingService.show();
    this.payrollService.emailPayslip(payslipId).subscribe({
      next: () => {
        this.toast.success('Email Sent', 'Payslip has been sent to your email successfully!');
        this.loadingService.hide();
      },
      error: (error) => {
        console.error('Error emailing payslip:', error);
        this.loadingService.hide();
        this.toast.error('Email Failed', error.error?.message || 'Failed to send payslip email.');
      }
    });
  }
}

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PayrollService } from '../../../../core/services/payroll.service';
import { EmployeeService } from '../../../../core/services/employee.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Employee } from '../../../../core/models/employee.model';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-payroll-generate',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './payroll-generate-component.html',
  styleUrls: ['./payroll-generate-component.scss']
})
export class PayrollGenerateComponent implements OnInit {
  employees: Employee[] = [];
  generating = false;
  isAdmin = false;

  months = [
    { value: 1,  label: 'January'   }, { value: 2,  label: 'February'  },
    { value: 3,  label: 'March'     }, { value: 4,  label: 'April'     },
    { value: 5,  label: 'May'       }, { value: 6,  label: 'June'      },
    { value: 7,  label: 'July'      }, { value: 8,  label: 'August'    },
    { value: 9,  label: 'September' }, { value: 10, label: 'October'   },
    { value: 11, label: 'November'  }, { value: 12, label: 'December'  }
  ];

  form = {
    employeeId: null as number | null,
    month:      new Date().getMonth() + 1,
    year:       new Date().getFullYear(),
    basicSalary: 0,
    allowances:  0,
    deductions:  0
  };

  constructor(
    private payrollService: PayrollService,
    private employeeService: EmployeeService,
    private authService: AuthService,
    private toast: ToastService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.authService.isAdmin();
    this.loadEmployees();
  }

  loadEmployees(): void {
    this.employeeService.getAll().subscribe({
      next: (data) => { this.employees = data; this.cdr.detectChanges(); }
    });
  }

  onEmployeeChange(): void {
    const emp = this.employees.find(e => e.id === this.form.employeeId);
    if (emp) this.form.basicSalary = emp.salary;
  }

  get epfAmount(): number  { return +(this.form.basicSalary * 0.02).toFixed(2); }
  get socsoAmount(): number { return +(this.form.basicSalary * 0.005).toFixed(2); }
  get taxAmount(): number  { return +((this.form.basicSalary + this.form.allowances) * 0.1197).toFixed(2); }

  get netSalary(): number {
    return +(this.form.basicSalary + this.form.allowances
           - this.epfAmount - this.socsoAmount - this.taxAmount - this.form.deductions).toFixed(2);
  }

  generate(): void {
    if (!this.form.employeeId) return;
    this.generating = true;
    const payload = {
      employeeId:  this.form.employeeId!,
      month:       +this.form.month,
      year:        +this.form.year,
      basicSalary: +this.form.basicSalary,
      allowances:  +this.form.allowances,
      deductions:  +this.form.deductions
    };
    this.payrollService.generate(payload).subscribe({
      next: () => {
        this.generating = false;
        this.toast.success('Payroll Generated', 'Payslip has been created successfully.');
        this.form = {
          employeeId: null,
          month: new Date().getMonth() + 1,
          year:  new Date().getFullYear(),
          basicSalary: 0, allowances: 0, deductions: 0
        };
        // Navigate to list after successful generation
        this.router.navigate(['/payroll/list']);
      },
      error: (err: any) => {
        this.generating = false;
        this.toast.error('Generate Failed', err?.error?.message ?? 'Failed to generate payroll.');
      }
    });
  }
}

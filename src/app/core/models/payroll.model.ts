export interface Payroll {
  id: number;
  employeeId: number;
  employeeName: string;
  month: number;
  year: number;
  basicSalary: number;
  allowances: number;
  deductions: number;
  epfAmount: number;
  socsoAmount: number;
  taxAmount: number;
  grossIncome: number;
  netSalary: number;
  generatedOn: string;
}

export interface PayrollRequest {
  employeeId: number;
  month: number;
  year: number;
  basicSalary: number;
  allowances: number;
  deductions: number;
}

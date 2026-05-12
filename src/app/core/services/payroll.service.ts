import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Payroll, PayrollRequest } from '../models/payroll.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PayrollService {
  private apiUrl = `${environment.apiUrl}/payroll`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Payroll[]> {
    return this.http.get<Payroll[]>(this.apiUrl);
  }

  getByEmployee(employeeId: number): Observable<Payroll[]> {
    return this.http.get<Payroll[]>(`${this.apiUrl}/employee/${employeeId}`);
  }

  generate(payload: PayrollRequest): Observable<Payroll> {
    return this.http.post<Payroll>(this.apiUrl, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Email payslip to employee
   */
  emailPayslip(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/email/${id}`, {});
  }

  /**
   * Email payslips to multiple employees in bulk
   */
  emailBulk(payrollIds: number[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/email-bulk`, payrollIds);
  }

  /**
   * Download payslip as PDF
   */
  downloadPayslipPdf(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/pdf/${id}`, { responseType: 'blob' });
  }
}

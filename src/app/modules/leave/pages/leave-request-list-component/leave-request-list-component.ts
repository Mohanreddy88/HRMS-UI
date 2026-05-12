import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LeaveService } from '../../../../core/services/leave.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';

interface LeaveRequest {
  id: number;
  employeeId: number;
  employeeName: string;
  leaveTypeId: number;
  leaveTypeName: string;
  leaveTypeCode: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: string;
  requestedOn: string;
  approvedBy?: number;
  approverName?: string;
  approvedOn?: string;
  approvalRemarks?: string;
}

@Component({
  selector: 'app-leave-request-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './leave-request-list-component.html',
  styleUrls: ['./leave-request-list-component.scss']
})
export class LeaveRequestListComponent implements OnInit {
  leaveRequests: LeaveRequest[] = [];
  filteredRequests: LeaveRequest[] = [];
  loading = false;
  isAdmin = false;
  
  filterStatus: string | null = null;
  filterYear: number | null = null;

  selectedRequest: LeaveRequest | null = null;
  showApprovalModal = false;
  approvalRemarks = '';
  approvalAction: 'approve' | 'reject' = 'approve';
  
  showCancelModal = false;
  cancelReason = '';
  requestToCancel: LeaveRequest | null = null;
  
  showDeleteModal = false;
  requestToDelete: LeaveRequest | null = null;

  constructor(
    private leaveService: LeaveService,
    private authService: AuthService,
    private router: Router,
    private toast: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.authService.getRole() === 'Admin';
    this.loadLeaveRequests();
  }

  loadLeaveRequests(): void {
    this.loading = true;
    console.log('Loading leave requests...');
    
    this.leaveService.getAllRequests().subscribe({
      next: (data: any) => {
        console.log('Leave requests received:', data);
        this.leaveRequests = data;
        this.applyFilters();
        this.loading = false;
        this.cdr.detectChanges();
        console.log('Leave requests loaded, loading set to false');
      },
      error: (err: any) => {
        console.error('Error loading leave requests:', err);
        this.toast.error('Load Failed', 'Failed to load leave requests');
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  applyFilters(): void {
    this.filteredRequests = this.leaveRequests.filter(req => {
      if (this.filterStatus && req.status !== this.filterStatus) return false;
      
      if (this.filterYear) {
        const year = new Date(req.startDate).getFullYear();
        if (year !== this.filterYear) return false;
      }
      
      return true;
    });
    this.cdr.detectChanges();
  }

  newRequest(): void {
    this.router.navigate(['/leave/request']);
  }

  openApprovalModal(request: LeaveRequest, action: 'approve' | 'reject'): void {
    this.selectedRequest = request;
    this.approvalAction = action;
    this.approvalRemarks = '';
    this.showApprovalModal = true;
  }

  closeApprovalModal(): void {
    this.showApprovalModal = false;
    this.selectedRequest = null;
    this.approvalRemarks = '';
  }

  confirmApproval(): void {
    if (!this.selectedRequest) return;

    const requestId = this.selectedRequest.id;
    const remarks = this.approvalRemarks.trim();

    if (this.approvalAction === 'approve') {
      this.leaveService.approveRequest(requestId, remarks).subscribe({
        next: () => {
          this.toast.success('Approved', 'Leave request approved successfully');
          this.closeApprovalModal();
          this.loadLeaveRequests();
        },
        error: (err: any) => {
          console.error('Error approving leave:', err);
          this.toast.error('Approval Failed', err.error?.message || 'Failed to approve leave request');
        }
      });
    } else {
      if (!remarks) {
        this.toast.warning('Required', 'Please provide a reason for rejection');
        return;
      }
      
      this.leaveService.rejectRequest(requestId, remarks).subscribe({
        next: () => {
          this.toast.warning('Rejected', 'Leave request rejected');
          this.closeApprovalModal();
          this.loadLeaveRequests();
        },
        error: (err: any) => {
          console.error('Error rejecting leave:', err);
          this.toast.error('Rejection Failed', err.error?.message || 'Failed to reject leave request');
        }
      });
    }
  }

  cancelRequest(request: LeaveRequest): void {
    this.requestToCancel = request;
    this.cancelReason = '';
    this.showCancelModal = true;
  }

  confirmCancel(): void {
    if (!this.requestToCancel || !this.cancelReason.trim()) {
      this.toast.warning('Required', 'Please provide a reason for cancellation');
      return;
    }

    this.leaveService.cancelRequest(this.requestToCancel.id, this.cancelReason.trim()).subscribe({
      next: () => {
        this.toast.success('Cancelled', 'Leave request cancelled successfully');
        this.closeCancelModal();
        this.loadLeaveRequests();
      },
      error: (err: any) => {
        console.error('Error cancelling leave:', err);
        this.toast.error('Cancel Failed', err.error?.message || 'Failed to cancel leave request');
      }
    });
  }

  closeCancelModal(): void {
    this.showCancelModal = false;
    this.requestToCancel = null;
    this.cancelReason = '';
  }

  deleteRequest(request: LeaveRequest): void {
    this.requestToDelete = request;
    this.showDeleteModal = true;
  }

  confirmDelete(): void {
    if (!this.requestToDelete) return;

    this.leaveService.deleteRequest(this.requestToDelete.id).subscribe({
      next: () => {
        this.toast.success('Deleted', 'Leave request deleted successfully');
        this.closeDeleteModal();
        this.loadLeaveRequests();
      },
      error: (err: any) => {
        console.error('Error deleting leave request:', err);
        this.toast.error('Delete Failed', err.error?.message || 'Failed to delete leave request');
      }
    });
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.requestToDelete = null;
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      'Pending': 'pending',
      'Approved': 'approved',
      'Rejected': 'rejected',
      'Cancelled': 'cancelled'
    };
    return map[status] || 'pending';
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-MY', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  }
}

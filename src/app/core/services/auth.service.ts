import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { LoginRequest, LoginResponse } from '../models/auth.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'hrms_token';
  private readonly USER_KEY  = 'hrms_user';

  // FIX 1 — no PLATFORM_ID / isPlatformBrowser; simple runtime check
  private isBrowser = typeof window !== 'undefined';

  // FIX 2 — initialise directly from token so BehaviorSubject is correct on first emit
  private loggedIn$ = new BehaviorSubject<boolean>(this.hasToken());

  // FIX 3 — clean constructor, no redundant next() call
  constructor(private http: HttpClient, private router: Router) {}

  login(payload: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, payload).pipe(
      tap(res => {
        this.setItem(this.TOKEN_KEY, res.token);
        this.setItem(this.USER_KEY, JSON.stringify({ username: res.username, role: res.role }));
        this.loggedIn$.next(true);
      })
    );
  }

  logout(): void {
    this.removeItem(this.TOKEN_KEY);
    this.removeItem(this.USER_KEY);
    this.loggedIn$.next(false);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return this.getItem(this.TOKEN_KEY);
  }

  getUser(): { username: string; role: string } | null {
    const raw = this.getItem(this.USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  isLoggedIn(): Observable<boolean> {
    return this.loggedIn$.asObservable();
  }

  isAuthenticated(): boolean {
    return this.hasToken();
  }

  isAdmin(): boolean {
    const user = this.getUser();
    return user?.role?.toLowerCase() === 'admin';
  }

  isUser(): boolean {
    const user = this.getUser();
    return user?.role?.toLowerCase() === 'user';
  }

  getUsername(): string | null {
    const user = this.getUser();
    return user?.username ?? null;
  }

  getRole(): string | null {
    const user = this.getUser();
    return user?.role ?? null;
  }

  private hasToken(): boolean {
    return !!this.getItem(this.TOKEN_KEY);
  }

  private getItem(key: string): string | null {
    return this.isBrowser ? localStorage.getItem(key) : null;
  }

  private setItem(key: string, value: string): void {
    if (this.isBrowser) localStorage.setItem(key, value);
  }

  private removeItem(key: string): void {
    if (this.isBrowser) localStorage.removeItem(key);
  }
}

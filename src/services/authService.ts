import { authApi } from '../lib/apiClient';

export enum UserRole {
  ADMIN = 'ADMIN',
  OPS_MANAGER = 'OPS_MANAGER',
  ANNOTATOR = 'ANNOTATOR',
  REVIEWER = 'REVIEWER',
  CUSTOMER = 'CUSTOMER',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  permissions: string[];
  status: UserStatus;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
  expiresIn: number;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}

export interface UpdateProfileDto {
  name?: string;
  email?: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface SessionResponse {
  valid: boolean;
  user: User;
}

class AuthService {
  /**
   * Login user with email and password
   */
  async login(dto: LoginDto): Promise<AuthResponse> {
    const response = await authApi.post<{ success: boolean; data: AuthResponse }>('/login', dto);
    return response.data;
  }

  /**
   * Register new user
   */
  async register(dto: RegisterDto): Promise<AuthResponse> {
    const response = await authApi.post<{ success: boolean; data: AuthResponse }>('/register', dto);
    return response.data;
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const response = await authApi.post<{ success: boolean; data: AuthResponse }>('/refresh', { refreshToken });
    return response.data;
  }

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    await authApi.post('/logout');
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<User> {
    const response = await authApi.get<{ success: boolean; data: User }>('/me');
    return response.data;
  }

  /**
   * Update user profile
   */
  async updateProfile(dto: UpdateProfileDto): Promise<User> {
    const response = await authApi.patch<{ success: boolean; data: User }>('/profile', dto);
    return response.data;
  }

  /**
   * Change password
   */
  async changePassword(dto: ChangePasswordDto): Promise<void> {
    await authApi.patch('/password', dto);
  }

  /**
   * Validate session and get user info
   */
  async validateSession(): Promise<SessionResponse> {
    const response = await authApi.get<{ success: boolean; data: SessionResponse }>('/session');
    return response.data;
  }

  /**
   * Check if user has required role
   */
  hasRole(user: User | null, requiredRoles: UserRole[]): boolean {
    if (!user) return false;
    return requiredRoles.includes(user.role);
  }

  /**
   * Check if user has required permission
   */
  hasPermission(user: User | null, requiredPermission: string): boolean {
    if (!user) return false;
    
    // Admin has all permissions
    if (user.permissions.includes('*')) return true;
    
    return user.permissions.includes(requiredPermission);
  }

  /**
   * Check if user has any of the required permissions
   */
  hasAnyPermission(user: User | null, requiredPermissions: string[]): boolean {
    if (!user) return false;
    
    // Admin has all permissions
    if (user.permissions.includes('*')) return true;
    
    return requiredPermissions.some(permission => user.permissions.includes(permission));
  }

  /**
   * Check if user has all required permissions
   */
  hasAllPermissions(user: User | null, requiredPermissions: string[]): boolean {
    if (!user) return false;
    
    // Admin has all permissions
    if (user.permissions.includes('*')) return true;
    
    return requiredPermissions.every(permission => user.permissions.includes(permission));
  }
}

export const authService = new AuthService();

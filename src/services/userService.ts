import axios from 'axios';
import { User, UserRole, UserStatus } from './authService';

const AUTH_API_BASE = 'http://localhost:3002/api/v1/auth';
const PROJECT_API_BASE = 'http://localhost:3004/api/v1';

/**
 * User Management DTOs
 */
export interface CreateUserDto {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  status?: UserStatus;
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
  role?: UserRole;
  status?: UserStatus;
}

export interface UserQueryParams {
  role?: UserRole;
  status?: UserStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedUsers {
  data: User[];
  total: number;
  page: number;
  limit: number;
}

export interface ProjectTeamMember {
  id: string;
  userId: string;
  projectId: string;
  role: UserRole;
  quota?: number;
  assignedTasks: number;
  completedTasks: number;
  user?: User;
}

export interface AssignUserToProjectDto {
  userId: string;
  projectId: string;
  role: UserRole;
  quota?: number;
}

/**
 * User Management Service
 */
class UserService {
  private getAuthHeaders() {
    const token = localStorage.getItem('accessToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  /**
   * Create a new user (Admin/Ops Manager only)
   */
  async createUser(dto: CreateUserDto): Promise<User> {
    try {
      const response = await axios.post(
        `${AUTH_API_BASE}/register`,
        dto,
        { headers: this.getAuthHeaders() }
      );
      return response.data.data?.user || response.data.user || response.data;
    } catch (error: any) {
      console.error('Failed to create user:', error);
      throw new Error(error.response?.data?.message || 'Failed to create user');
    }
  }

  /**
   * List all users with filters
   */
  async listUsers(params?: UserQueryParams): Promise<PaginatedUsers> {
    try {
      // Note: This endpoint might need to be implemented in auth service
      // For now, we'll use a mock implementation or the existing /users endpoint
      const queryParams = new URLSearchParams();
      
      if (params?.role) queryParams.append('role', params.role);
      if (params?.status) queryParams.append('status', params.status);
      if (params?.search) queryParams.append('search', params.search);
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());

      const response = await axios.get(
        `${AUTH_API_BASE}/users?${queryParams.toString()}`,
        { headers: this.getAuthHeaders() }
      );

      // Handle different response formats
      const data = response.data.data || response.data;
      
      if (Array.isArray(data)) {
        return {
          data,
          total: data.length,
          page: params?.page || 1,
          limit: params?.limit || 20,
        };
      }

      return {
        data: data.users || data.data || [],
        total: data.total || 0,
        page: data.page || params?.page || 1,
        limit: data.limit || params?.limit || 20,
      };
    } catch (error: any) {
      console.error('Failed to list users:', error);
      // Return mock data if endpoint doesn't exist yet
      if (error.response?.status === 404) {
        return this.getMockUsers(params);
      }
      throw new Error(error.response?.data?.message || 'Failed to list users');
    }
  }

  /**
   * Get a single user by ID
   */
  async getUser(userId: string): Promise<User> {
    try {
      const response = await axios.get(
        `${AUTH_API_BASE}/users/${userId}`,
        { headers: this.getAuthHeaders() }
      );
      return response.data.data || response.data;
    } catch (error: any) {
      console.error('Failed to get user:', error);
      throw new Error(error.response?.data?.message || 'Failed to get user');
    }
  }

  /**
   * Update user details
   */
  async updateUser(userId: string, dto: UpdateUserDto): Promise<User> {
    try {
      const response = await axios.patch(
        `${AUTH_API_BASE}/users/${userId}`,
        dto,
        { headers: this.getAuthHeaders() }
      );
      return response.data.data || response.data;
    } catch (error: any) {
      console.error('Failed to update user:', error);
      throw new Error(error.response?.data?.message || 'Failed to update user');
    }
  }

  /**
   * Delete user (soft delete - sets status to INACTIVE)
   */
  async deleteUser(userId: string): Promise<void> {
    try {
      await axios.delete(
        `${AUTH_API_BASE}/users/${userId}`,
        { headers: this.getAuthHeaders() }
      );
    } catch (error: any) {
      console.error('Failed to delete user:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete user');
    }
  }

  /**
   * Update user status
   */
  async updateUserStatus(userId: string, status: UserStatus): Promise<User> {
    return this.updateUser(userId, { status });
  }

  /**
   * Assign user to project team
   */
  async assignUserToProject(dto: AssignUserToProjectDto): Promise<ProjectTeamMember> {
    try {
      const response = await axios.post(
        `${PROJECT_API_BASE}/projects/${dto.projectId}/team`,
        dto,
        { headers: this.getAuthHeaders() }
      );
      return response.data.data || response.data;
    } catch (error: any) {
      console.error('Failed to assign user to project:', error);
      throw new Error(error.response?.data?.message || 'Failed to assign user to project');
    }
  }

  /**
   * Remove user from project team
   */
  async removeUserFromProject(projectId: string, userId: string): Promise<void> {
    try {
      await axios.delete(
        `${PROJECT_API_BASE}/projects/${projectId}/team/${userId}`,
        { headers: this.getAuthHeaders() }
      );
    } catch (error: any) {
      console.error('Failed to remove user from project:', error);
      throw new Error(error.response?.data?.message || 'Failed to remove user from project');
    }
  }

  /**
   * Get project team members
   */
  async getProjectTeam(projectId: string): Promise<ProjectTeamMember[]> {
    try {
      const response = await axios.get(
        `${PROJECT_API_BASE}/projects/${projectId}/team`,
        { headers: this.getAuthHeaders() }
      );
      return response.data.data || response.data || [];
    } catch (error: any) {
      console.error('Failed to get project team:', error);
      return [];
    }
  }

  /**
   * Update team member quota
   */
  async updateTeamMemberQuota(projectId: string, userId: string, quota: number): Promise<ProjectTeamMember> {
    try {
      const response = await axios.patch(
        `${PROJECT_API_BASE}/projects/${projectId}/team/${userId}`,
        { quota },
        { headers: this.getAuthHeaders() }
      );
      return response.data.data || response.data;
    } catch (error: any) {
      console.error('Failed to update team member quota:', error);
      throw new Error(error.response?.data?.message || 'Failed to update quota');
    }
  }

  /**
   * Get available annotators (users with ANNOTATOR role and ACTIVE status)
   */
  async getAvailableAnnotators(): Promise<User[]> {
    const result = await this.listUsers({ role: UserRole.ANNOTATOR, status: UserStatus.ACTIVE });
    return result.data;
  }

  /**
   * Get available reviewers (users with REVIEWER role and ACTIVE status)
   */
  async getAvailableReviewers(): Promise<User[]> {
    const result = await this.listUsers({ role: UserRole.REVIEWER, status: UserStatus.ACTIVE });
    return result.data;
  }

  /**
   * Mock users for development (fallback when API not available)
   */
  private getMockUsers(params?: UserQueryParams): PaginatedUsers {
    const mockUsers: User[] = [
      {
        id: '1',
        email: 'admin@welo.com',
        name: 'Admin User',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        permissions: ['*'],
        createdAt: '2026-01-01T00:00:00Z',
      },
      {
        id: '2',
        email: 'ops@welo.com',
        name: 'Ops Manager',
        role: UserRole.PROJECT_MANAGER,
        status: UserStatus.ACTIVE,
        permissions: ['projects.*', 'batches.*'],
        createdAt: '2026-01-02T00:00:00Z',
      },
      {
        id: '3',
        email: 'annotator@welo.com',
        name: 'Annotator User',
        role: UserRole.ANNOTATOR,
        status: UserStatus.ACTIVE,
        permissions: ['tasks.read', 'tasks.annotate'],
        createdAt: '2026-01-03T00:00:00Z',
      },
      {
        id: '4',
        email: 'reviewer@welo.com',
        name: 'Reviewer User',
        role: UserRole.REVIEWER,
        status: UserStatus.ACTIVE,
        permissions: ['tasks.read', 'tasks.review'],
        createdAt: '2026-01-04T00:00:00Z',
      },
    ];

    let filtered = [...mockUsers];

    if (params?.role) {
      filtered = filtered.filter(u => u.role === params.role);
    }

    if (params?.status) {
      filtered = filtered.filter(u => u.status === params.status);
    }

    if (params?.search) {
      const search = params.search.toLowerCase();
      filtered = filtered.filter(u => 
        u.name.toLowerCase().includes(search) || 
        u.email.toLowerCase().includes(search)
      );
    }

    return {
      data: filtered,
      total: filtered.length,
      page: params?.page || 1,
      limit: params?.limit || 20,
    };
  }
}

export const userService = new UserService();

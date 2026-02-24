import { authApi } from '../lib/apiClient';
import { User, UserRole, UserStatus } from './authService';

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
  password?: string;
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
 * Uses authApi client which handles token injection and error handling automatically
 */
class UserService {
  /**
   * Create a new user (Admin/Ops Manager only)
   */
  async createUser(dto: CreateUserDto): Promise<User> {
    const response = await authApi.post<{ success: boolean; data: User; message: string }>(
      '/users',
      dto,
    );
    return response.data;
  }

  /**
   * List all users with filters
   */
  async listUsers(params?: UserQueryParams): Promise<PaginatedUsers> {
    const queryParams = new URLSearchParams();

    if (params?.role) queryParams.append('role', params.role);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const queryString = queryParams.toString();
    const url = `/users${queryString ? `?${queryString}` : ''}`;

    const response = await authApi.get<{ success: boolean; data: PaginatedUsers }>(url);
    return response.data;
  }

  /**
   * Get a single user by ID
   */
  async getUser(userId: string): Promise<User> {
    const response = await authApi.get<{ success: boolean; data: User }>(`/users/${userId}`);
    return response.data;
  }

  /**
   * Update user details
   */
  async updateUser(userId: string, dto: UpdateUserDto): Promise<User> {
    const response = await authApi.patch<{ success: boolean; data: User; message: string }>(
      `/users/${userId}`,
      dto,
    );
    return response.data;
  }

  /**
   * Delete user
   */
  async deleteUser(userId: string): Promise<void> {
    await authApi.delete(`/users/${userId}`);
  }

  /**
   * Update user status
   */
  async updateUserStatus(userId: string, status: UserStatus): Promise<User> {
    return this.updateUser(userId, { status });
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
   * Get project team members
   * This delegates to projectService for consistency
   */
  async getProjectTeam(projectId: string): Promise<ProjectTeamMember[]> {
    // Import projectService dynamically to avoid circular dependency
    const { projectService } = await import('./projectService');
    return projectService.getProjectTeam(projectId);
  }

  /**
   * Assign user to project
   * This delegates to projectService for consistency
   */
  async assignUserToProject(data: AssignUserToProjectDto): Promise<any> {
    const { projectService } = await import('./projectService');
    return projectService.assignUserToProject(data);
  }

  /**
   * Assign multiple users to project in bulk
   * This delegates to projectService for consistency
   */
  async assignUsersToProject(assignments: AssignUserToProjectDto[]): Promise<any> {
    const { projectService } = await import('./projectService');
    return projectService.assignUsersToProject(assignments);
  }

  /**
   * Remove user from project
   */
  async removeUserFromProject(projectId: string, userId: string): Promise<void> {
    const { projectService } = await import('./projectService');
    return projectService.removeUserFromProject(projectId, userId);
  }

  /**
   * Update team member quota
   */
  async updateTeamMemberQuota(projectId: string, userId: string, quota: number): Promise<any> {
    const { projectService } = await import('./projectService');
    return projectService.updateTeamMember(projectId, userId, { quota });
  }
}

export const userService = new UserService();

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { projectService } from '../services/projectService';
import { Project, CreateProjectInput, UpdateProjectInput, ProjectStatistics, ProjectStatus } from '../types';

interface ProjectsState {
  projects: Project[];
  currentProject: Project | null;
  statistics: ProjectStatistics | null;
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  limit: number;
}

const initialState: ProjectsState = {
  projects: [],
  currentProject: null,
  statistics: null,
  loading: false,
  error: null,
  total: 0,
  page: 1,
  limit: 10,
};

export const fetchProjects = createAsyncThunk(
  'projects/fetchProjects',
  async (params: {
    customerId?: string;
    status?: ProjectStatus;
    search?: string;
    page?: number;
    limit?: number;
  } = {}, { rejectWithValue }) => {
    try {
      const { page = 1, limit = 10, customerId, status, search } = params;
      
      const response = await projectService.fetchProjects({
        customerId,
        status,
        search,
        page,
        limit,
      });

      return {
        projects: response.data,
        total: response.total,
        page: response.page,
        limit: response.limit,
      };
    } catch (error: unknown) {
      const err = error as Error;
      return rejectWithValue(err.message);
    }
  }
);

export const fetchProjectById = createAsyncThunk(
  'projects/fetchProjectById',
  async (projectId: string, { rejectWithValue }) => {
    try {
      const project = await projectService.fetchProjectById(projectId);
      return project;
    } catch (error: unknown) {
      const err = error as Error;
      return rejectWithValue(err.message);
    }
  }
);

export const createProject = createAsyncThunk(
  'projects/createProject',
  async ({ input, userId }: { input: CreateProjectInput; userId: string }, { rejectWithValue }) => {
    try {
      const project = await projectService.createProject(input, userId);
      return project;
    } catch (error: unknown) {
      const err = error as Error;
      return rejectWithValue(err.message);
    }
  }
);

export const updateProject = createAsyncThunk(
  'projects/updateProject',
  async ({ id, input }: { id: string; input: UpdateProjectInput }, { rejectWithValue }) => {
    try {
      const project = await projectService.updateProject(id, input);
      return project;
    } catch (error: unknown) {
      const err = error as Error;
      return rejectWithValue(err.message);
    }
  }
);

export const deleteProject = createAsyncThunk(
  'projects/deleteProject',
  async (projectId: string, { rejectWithValue }) => {
    try {
      await projectService.deleteProject(projectId);
      return projectId;
    } catch (error: unknown) {
      const err = error as Error;
      return rejectWithValue(err.message);
    }
  }
);

export const cloneProject = createAsyncThunk(
  'projects/cloneProject',
  async ({ projectId, newName, userId: _userId }: { projectId: string; newName: string; userId: string }, { rejectWithValue }) => {
    try {
      const project = await projectService.cloneProject(projectId, newName, false);
      return project;
    } catch (error: unknown) {
      const err = error as Error;
      return rejectWithValue(err.message);
    }
  }
);

export const fetchProjectStatistics = createAsyncThunk(
  'projects/fetchProjectStatistics',
  async (projectId: string, { rejectWithValue }) => {
    try {
      const stats = await projectService.getProjectStatistics(projectId);
      return stats;
    } catch (error: unknown) {
      const err = error as Error;
      return rejectWithValue(err.message);
    }
  }
);

const projectsSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentProject: (state) => {
      state.currentProject = null;
      state.statistics = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action: PayloadAction<{ projects: Project[]; total: number; page: number; limit: number }>) => {
        state.loading = false;
        state.projects = action.payload.projects;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.limit = action.payload.limit;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchProjectById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjectById.fulfilled, (state, action: PayloadAction<Project>) => {
        state.loading = false;
        state.currentProject = action.payload;
      })
      .addCase(fetchProjectById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createProject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createProject.fulfilled, (state, action: PayloadAction<Project>) => {
        state.loading = false;
        state.projects.unshift(action.payload);
        state.total += 1;
      })
      .addCase(createProject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateProject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProject.fulfilled, (state, action: PayloadAction<Project>) => {
        state.loading = false;
        const index = state.projects.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) {
          state.projects[index] = action.payload;
        }
        if (state.currentProject?.id === action.payload.id) {
          state.currentProject = action.payload;
        }
      })
      .addCase(updateProject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteProject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteProject.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.projects = state.projects.filter((p) => p.id !== action.payload);
        state.total -= 1;
      })
      .addCase(deleteProject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(cloneProject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(cloneProject.fulfilled, (state, action: PayloadAction<Project>) => {
        state.loading = false;
        state.projects.unshift(action.payload);
        state.total += 1;
      })
      .addCase(cloneProject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchProjectStatistics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjectStatistics.fulfilled, (state, action: PayloadAction<ProjectStatistics>) => {
        state.loading = false;
        state.statistics = action.payload;
      })
      .addCase(fetchProjectStatistics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearCurrentProject } = projectsSlice.actions;
export default projectsSlice.reducer;

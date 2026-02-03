import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { supabase } from '../lib/supabase';
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
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      let query = supabase
        .from('projects')
        .select('*, customer:customers(*)', { count: 'exact' })
        .range(from, to)
        .order('created_at', { ascending: false });

      if (customerId) {
        query = query.eq('customer_id', customerId);
      }

      if (status) {
        query = query.eq('status', status);
      }

      if (search) {
        query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        projects: data as Project[],
        total: count || 0,
        page,
        limit,
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
      const { data, error } = await supabase
        .from('projects')
        .select('*, customer:customers(*)')
        .eq('id', projectId)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Project not found');

      return data as Project;
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
      const { data, error } = await supabase
        .from('projects')
        .insert([
          {
            ...input,
            created_by: userId,
            status: 'DRAFT',
          },
        ])
        .select('*, customer:customers(*)')
        .single();

      if (error) throw error;

      return data as Project;
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
      const { data, error } = await supabase
        .from('projects')
        .update(input)
        .eq('id', id)
        .select('*, customer:customers(*)')
        .single();

      if (error) throw error;

      return data as Project;
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
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;

      return projectId;
    } catch (error: unknown) {
      const err = error as Error;
      return rejectWithValue(err.message);
    }
  }
);

export const cloneProject = createAsyncThunk(
  'projects/cloneProject',
  async ({ projectId, newName, userId }: { projectId: string; newName: string; userId: string }, { rejectWithValue }) => {
    try {
      const { data: originalProject, error: fetchError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (fetchError) throw fetchError;
      if (!originalProject) throw new Error('Project not found');

      const { data: clonedProject, error: createError } = await supabase
        .from('projects')
        .insert([
          {
            name: newName,
            description: originalProject.description,
            customer_id: originalProject.customer_id,
            project_type: originalProject.project_type,
            annotation_questions: originalProject.annotation_questions,
            workflow_config: originalProject.workflow_config,
            quality_threshold: originalProject.quality_threshold,
            created_by: userId,
            status: 'DRAFT',
          },
        ])
        .select('*, customer:customers(*)')
        .single();

      if (createError) throw createError;

      return clonedProject as Project;
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
      const { data, error } = await supabase
        .rpc('get_project_statistics', { project_id: projectId });

      if (error) throw error;

      return data as ProjectStatistics;
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

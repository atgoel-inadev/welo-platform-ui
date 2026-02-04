import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { taskService, Task, Assignment, SubmitTaskDto, GetNextTaskDto, TaskFilterDto } from '../services/taskService';
import { TaskStatus } from '../types';

interface TasksState {
  myTasks: Assignment[];
  currentTask: Task | null;
  loading: boolean;
  pulling: boolean;
  submitting: boolean;
  error: string | null;
  total: number;
  page: number;
  limit: number;
}

const initialState: TasksState = {
  myTasks: [],
  currentTask: null,
  loading: false,
  pulling: false,
  submitting: false,
  error: null,
  total: 0,
  page: 1,
  limit: 10,
};

/**
 * Fetch tasks assigned to the current user
 */
export const fetchMyTasks = createAsyncThunk(
  'tasks/fetchMyTasks',
  async (params: {
    userId: string;
    status?: 'ASSIGNED' | 'IN_PROGRESS';
  }, { rejectWithValue }) => {
    try {
      const assignments = await taskService.getMyTasks(params.userId, params.status);
      return assignments;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch tasks');
    }
  }
);

/**
 * Pull the next available task from the queue
 */
export const pullNextTask = createAsyncThunk(
  'tasks/pullNextTask',
  async (dto: GetNextTaskDto, { rejectWithValue }) => {
    try {
      const task = await taskService.pullNextTask(dto);
      if (!task) {
        return rejectWithValue('No tasks available in the queue');
      }
      return task;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to pull task');
    }
  }
);

/**
 * Fetch detailed information about a specific task
 */
export const fetchTaskDetails = createAsyncThunk(
  'tasks/fetchTaskDetails',
  async (taskId: string, { rejectWithValue }) => {
    try {
      const task = await taskService.getTaskDetails(taskId);
      return task;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch task details');
    }
  }
);

/**
 * Submit annotation for a task
 */
export const submitAnnotation = createAsyncThunk(
  'tasks/submitAnnotation',
  async ({ taskId, dto }: { taskId: string; dto: SubmitTaskDto }, { rejectWithValue }) => {
    try {
      await taskService.submitTask(taskId, dto);
      return taskId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to submit annotation');
    }
  }
);

/**
 * Update task status
 */
export const updateTaskStatus = createAsyncThunk(
  'tasks/updateTaskStatus',
  async ({ taskId, status, reason }: { taskId: string; status: TaskStatus; reason?: string }, { rejectWithValue }) => {
    try {
      await taskService.updateTaskStatus(taskId, { status, reason });
      return { taskId, status };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update task status');
    }
  }
);

/**
 * Skip a task with a reason
 */
export const skipTask = createAsyncThunk(
  'tasks/skipTask',
  async ({ taskId, reason }: { taskId: string; reason: string }, { rejectWithValue }) => {
    try {
      await taskService.skipTask(taskId, reason);
      return taskId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to skip task');
    }
  }
);

/**
 * List tasks with filters
 */
export const listTasks = createAsyncThunk(
  'tasks/listTasks',
  async (filters: TaskFilterDto, { rejectWithValue }) => {
    try {
      const response = await taskService.listTasks(filters);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to list tasks');
    }
  }
);

const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentTask: (state) => {
      state.currentTask = null;
    },
    setCurrentTask: (state, action: PayloadAction<Task>) => {
      state.currentTask = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Fetch My Tasks
    builder
      .addCase(fetchMyTasks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyTasks.fulfilled, (state, action) => {
        state.loading = false;
        state.myTasks = action.payload;
      })
      .addCase(fetchMyTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Pull Next Task
    builder
      .addCase(pullNextTask.pending, (state) => {
        state.pulling = true;
        state.error = null;
      })
      .addCase(pullNextTask.fulfilled, (state, action) => {
        state.pulling = false;
        state.currentTask = action.payload;
      })
      .addCase(pullNextTask.rejected, (state, action) => {
        state.pulling = false;
        state.error = action.payload as string;
      });

    // Fetch Task Details
    builder
      .addCase(fetchTaskDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTaskDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.currentTask = action.payload;
      })
      .addCase(fetchTaskDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Submit Annotation
    builder
      .addCase(submitAnnotation.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(submitAnnotation.fulfilled, (state, action) => {
        state.submitting = false;
        // Remove the submitted task from myTasks
        state.myTasks = state.myTasks.filter(
          (assignment) => assignment.taskId !== action.payload
        );
        state.currentTask = null;
      })
      .addCase(submitAnnotation.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload as string;
      });

    // Update Task Status
    builder
      .addCase(updateTaskStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTaskStatus.fulfilled, (state, action) => {
        state.loading = false;
        // Update the task in myTasks if it exists
        const assignment = state.myTasks.find(
          (a) => a.taskId === action.payload.taskId
        );
        if (assignment && assignment.task) {
          assignment.task.status = action.payload.status;
        }
        if (state.currentTask?.id === action.payload.taskId) {
          state.currentTask.status = action.payload.status;
        }
      })
      .addCase(updateTaskStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Skip Task
    builder
      .addCase(skipTask.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(skipTask.fulfilled, (state, action) => {
        state.loading = false;
        // Remove the skipped task from myTasks
        state.myTasks = state.myTasks.filter(
          (assignment) => assignment.taskId !== action.payload
        );
        if (state.currentTask?.id === action.payload) {
          state.currentTask = null;
        }
      })
      .addCase(skipTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // List Tasks
    builder
      .addCase(listTasks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(listTasks.fulfilled, (state) => {
        state.loading = false;
        // This is different from myTasks - it's a filtered/searched list
        // We won't update myTasks here, just clear error
      })
      .addCase(listTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearCurrentTask, setCurrentTask } = tasksSlice.actions;
export default tasksSlice.reducer;

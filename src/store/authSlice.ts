import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { authService, User, UserRole, AuthResponse } from '../services/authService';
import { authApi, projectManagementApi, taskManagementApi, workflowEngineApi } from '../lib/apiClient';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  initialCheckDone: boolean;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  loading: false,
  error: null,
  isAuthenticated: false,
  initialCheckDone: false,
};

// Helper to set tokens in all API clients
const setTokensInClients = (token: string) => {
  authApi.setToken(token);
  projectManagementApi.setToken(token);
  taskManagementApi.setToken(token);
  workflowEngineApi.setToken(token);
};

// Helper to clear tokens from all API clients
const clearTokensFromClients = () => {
  authApi.clearToken();
  projectManagementApi.clearToken();
  taskManagementApi.clearToken();
  workflowEngineApi.clearToken();
};

export const signIn = createAsyncThunk(
  'auth/signIn',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await authService.login({ email, password });
      
      // Store tokens in localStorage
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      // Set tokens in API clients
      setTokensInClients(response.accessToken);
      
      return response;
    } catch (error: unknown) {
      const err = error as Error;
      return rejectWithValue(err.message);
    }
  }
);

export const signUp = createAsyncThunk(
  'auth/signUp',
  async ({ email, password, name, role = UserRole.ANNOTATOR }: { email: string; password: string; name: string; role?: UserRole }, { rejectWithValue }) => {
    try {
      const response = await authService.register({ email, password, name, role });
      
      // Store tokens in localStorage
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      // Set tokens in API clients
      setTokensInClients(response.accessToken);
      
      return response;
    } catch (error: unknown) {
      const err = error as Error;
      return rejectWithValue(err.message);
    }
  }
);

export const signOut = createAsyncThunk('auth/signOut', async (_, { rejectWithValue }) => {
  try {
    await authService.logout();
    
    // Clear tokens from localStorage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    
    // Clear tokens from API clients
    clearTokensFromClients();
  } catch (error: unknown) {
    const err = error as Error;
    return rejectWithValue(err.message);
  }
});

export const checkSession = createAsyncThunk('auth/checkSession', async (_, { rejectWithValue }) => {
  try {
    const accessToken = localStorage.getItem('accessToken');
    const storedUser = localStorage.getItem('user');
    
    if (!accessToken || !storedUser) {
      return { user: null, accessToken: null, refreshToken: null };
    }
    
    // Set token in API clients
    setTokensInClients(accessToken);
    
    // Validate session with backend
    try {
      const sessionData = await authService.validateSession();
      
      return {
        user: sessionData.user,
        accessToken,
        refreshToken: localStorage.getItem('refreshToken'),
      };
    } catch (error) {
      // Token might be expired, try to refresh
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const response = await authService.refreshToken(refreshToken);
          
          // Update tokens in localStorage
          localStorage.setItem('accessToken', response.accessToken);
          localStorage.setItem('refreshToken', response.refreshToken);
          localStorage.setItem('user', JSON.stringify(response.user));
          
          // Set new token in API clients
          setTokensInClients(response.accessToken);
          
          return {
            user: response.user,
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
          };
        } catch (refreshError) {
          // Refresh failed, clear everything
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          clearTokensFromClients();
          return { user: null, accessToken: null, refreshToken: null };
        }
      }
      
      return { user: null, accessToken: null, refreshToken: null };
    }
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Session check error:', err.message);
    return rejectWithValue(err.message);
  }
});

export const getCurrentUser = createAsyncThunk('auth/getCurrentUser', async (_, { rejectWithValue }) => {
  try {
    const user = await authService.getCurrentUser();
    return user;
  } catch (error: unknown) {
    const err = error as Error;
    return rejectWithValue(err.message);
  }
});

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (profileData: { name?: string; email?: string }, { rejectWithValue }) => {
    try {
      const user = await authService.updateProfile(profileData);
      localStorage.setItem('user', JSON.stringify(user));
      return user;
    } catch (error: unknown) {
      const err = error as Error;
      return rejectWithValue(err.message);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCredentials: (state, action: PayloadAction<{ user: User; accessToken: string; refreshToken: string }>) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.isAuthenticated = true;
    },
    clearCredentials: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      clearTokensFromClients();
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(signIn.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signIn.fulfilled, (state, action: PayloadAction<AuthResponse>) => {
        state.loading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(signIn.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      })
      .addCase(signUp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signUp.fulfilled, (state, action: PayloadAction<AuthResponse>) => {
        state.loading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(signUp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(signOut.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = null;
      })
      .addCase(checkSession.fulfilled, (state, action: PayloadAction<{ user: User | null; accessToken: string | null; refreshToken: string | null }>) => {
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = !!action.payload.user;
        state.initialCheckDone = true;
      })
      .addCase(checkSession.rejected, (state) => {
        state.isAuthenticated = false;
        state.initialCheckDone = true;
      })
      .addCase(getCurrentUser.fulfilled, (state, action: PayloadAction<User>) => {
        state.user = action.payload;
      })
      .addCase(updateProfile.fulfilled, (state, action: PayloadAction<User>) => {
        state.user = action.payload;
      });
  },
});

export const { clearError, setCredentials, clearCredentials } = authSlice.actions;
export default authSlice.reducer;

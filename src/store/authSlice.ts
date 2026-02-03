import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { supabase } from '../lib/supabase';
import { User, UserRole } from '../types';

interface AuthState {
  user: User | null;
  session: unknown | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  initialCheckDone: boolean;
}

const initialState: AuthState = {
  user: null,
  session: null,
  loading: false,
  error: null,
  isAuthenticated: false,
  initialCheckDone: false,
};

export const signIn = createAsyncThunk(
  'auth/signIn',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (userError) throw userError;
      if (!userData) throw new Error('User not found in database');

      return { user: userData, session: authData.session };
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
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create auth user');

      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert([
          {
            id: authData.user.id,
            email,
            name,
            role,
          },
        ])
        .select()
        .single();

      if (userError) throw userError;

      return { user: userData, session: authData.session };
    } catch (error: unknown) {
      const err = error as Error;
      return rejectWithValue(err.message);
    }
  }
);

export const signOut = createAsyncThunk('auth/signOut', async (_, { rejectWithValue }) => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error: unknown) {
    const err = error as Error;
    return rejectWithValue(err.message);
  }
});

export const checkSession = createAsyncThunk('auth/checkSession', async (_, { rejectWithValue }) => {
  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Session check timeout')), 5000)
    );

    const sessionPromise = supabase.auth.getSession();

    const { data: { session } } = await Promise.race([
      sessionPromise,
      timeoutPromise
    ]) as Awaited<typeof sessionPromise>;

    if (!session) {
      return { user: null, session: null };
    }

    const userPromise = supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle();

    const { data: userData, error: userError } = await Promise.race([
      userPromise,
      timeoutPromise
    ]) as Awaited<typeof userPromise>;

    if (userError) throw userError;

    return { user: userData, session };
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Session check error:', err.message);
    return rejectWithValue(err.message);
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(signIn.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signIn.fulfilled, (state, action: PayloadAction<{ user: User; session: unknown }>) => {
        state.loading = false;
        state.user = action.payload.user;
        state.session = action.payload.session;
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
      .addCase(signUp.fulfilled, (state, action: PayloadAction<{ user: User; session: unknown }>) => {
        state.loading = false;
        state.user = action.payload.user;
        state.session = action.payload.session;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(signUp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(signOut.fulfilled, (state) => {
        state.user = null;
        state.session = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = null;
      })
      .addCase(checkSession.fulfilled, (state, action: PayloadAction<{ user: User | null; session: unknown }>) => {
        state.user = action.payload.user;
        state.session = action.payload.session;
        state.isAuthenticated = !!action.payload.user;
        state.initialCheckDone = true;
      })
      .addCase(checkSession.rejected, (state) => {
        state.isAuthenticated = false;
        state.initialCheckDone = true;
      });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;

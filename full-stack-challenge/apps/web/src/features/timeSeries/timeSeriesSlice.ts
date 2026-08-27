import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type {
  CreateSensorReadingsRequest,
  DeleteReadingsResponse,
  SensorMetricsDto,
  SensorReadingDto,
  TimeSeriesRangeParams,
} from '@dynamox/shared';
import { timeSeriesApi } from '../../services/api';
import { ApiClientError } from '../../services/apiClient';

interface TimeSeriesState {
  pointId: string | null;
  readings: SensorReadingDto[];
  metrics: SensorMetricsDto | null;
  globalCount: number | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  mutationStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: TimeSeriesState = {
  pointId: null,
  readings: [],
  metrics: null,
  globalCount: null,
  status: 'idle',
  mutationStatus: 'idle',
  error: null,
};

export const fetchTimeSeries = createAsyncThunk(
  'timeSeries/fetch',
  async (
    { pointId, range }: { pointId: string; range?: TimeSeriesRangeParams },
    { rejectWithValue }
  ) => {
    try {
      const [readings, metrics, globalCount] = await Promise.all([
        timeSeriesApi.list(pointId, range),
        timeSeriesApi.metrics(pointId, range),
        timeSeriesApi.globalCount(),
      ]);
      return { pointId, readings, metrics, globalCount: globalCount.count };
    } catch (error) {
      if (error instanceof ApiClientError) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Unable to load time-series');
    }
  }
);

export const storeTimeSeries = createAsyncThunk(
  'timeSeries/store',
  async (
    { pointId, payload }: { pointId: string; payload: CreateSensorReadingsRequest },
    { rejectWithValue }
  ) => {
    try {
      return await timeSeriesApi.store(pointId, payload);
    } catch (error) {
      if (error instanceof ApiClientError) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Unable to store time-series');
    }
  }
);

export const deleteTimeSeries = createAsyncThunk(
  'timeSeries/delete',
  async (
    { pointId, range }: { pointId: string; range?: TimeSeriesRangeParams },
    { rejectWithValue }
  ) => {
    try {
      return await timeSeriesApi.remove(pointId, range);
    } catch (error) {
      if (error instanceof ApiClientError) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Unable to delete time-series');
    }
  }
);

const timeSeriesSlice = createSlice({
  name: 'timeSeries',
  initialState,
  reducers: {
    clearTimeSeriesError(state) {
      state.error = null;
    },
    resetTimeSeries(state) {
      Object.assign(state, initialState);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTimeSeries.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchTimeSeries.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.pointId = action.payload.pointId;
        state.readings = action.payload.readings;
        state.metrics = action.payload.metrics;
        state.globalCount = action.payload.globalCount;
      })
      .addCase(fetchTimeSeries.rejected, (state, action) => {
        state.status = 'failed';
        state.error = (action.payload as string) ?? 'Failed to load time-series';
      })
      .addCase(storeTimeSeries.pending, (state) => {
        state.mutationStatus = 'loading';
        state.error = null;
      })
      .addCase(storeTimeSeries.fulfilled, (state) => {
        state.mutationStatus = 'succeeded';
      })
      .addCase(storeTimeSeries.rejected, (state, action) => {
        state.mutationStatus = 'failed';
        state.error = (action.payload as string) ?? 'Failed to store time-series';
      })
      .addCase(deleteTimeSeries.pending, (state) => {
        state.mutationStatus = 'loading';
        state.error = null;
      })
      .addCase(deleteTimeSeries.fulfilled, (state, action: { payload: DeleteReadingsResponse }) => {
        state.mutationStatus = 'succeeded';
        if (action.payload.deletedCount > 0) {
          state.readings = [];
          state.metrics = { count: 0, min: null, max: null, avg: null };
        }
      })
      .addCase(deleteTimeSeries.rejected, (state, action) => {
        state.mutationStatus = 'failed';
        state.error = (action.payload as string) ?? 'Failed to delete time-series';
      });
  },
});

export const { clearTimeSeriesError, resetTimeSeries } = timeSeriesSlice.actions;
export default timeSeriesSlice.reducer;

import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  Typography,
} from '@mui/material';
import DeleteIconImport from '@mui/icons-material/Delete';
import SensorsIconImport from '@mui/icons-material/Sensors';
import {
  MachineType,
  SensorModel,
  isSensorAllowedForMachine,
  type MachineDto,
  type MonitoringPointDto,
  type MonitoringPointSortField,
} from '@dynamox/shared';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { fetchMachines } from '../features/machines/machinesSlice';
import {
  associateSensor,
  clearMonitoringPointsError,
  createMonitoringPoint,
  deleteMonitoringPoint,
  fetchMonitoringPoints,
  removeSensor,
  setMonitoringPointsPage,
  setMonitoringPointsSort,
} from '../features/monitoringPoints/monitoringPointsSlice';
import { resolveMuiIcon } from '../utils/resolveMuiIcon';

const DeleteIcon = resolveMuiIcon(DeleteIconImport);
const SensorsIcon = resolveMuiIcon(SensorsIconImport);

const ALL_SENSOR_MODELS = [SensorModel.TcAg, SensorModel.TcAs, SensorModel.HFPlus];

const columns: Array<{ id: MonitoringPointSortField; label: string }> = [
  { id: 'machineName', label: 'Machine Name' },
  { id: 'machineType', label: 'Machine Type' },
  { id: 'name', label: 'Monitoring Point Name' },
  { id: 'sensorModel', label: 'Sensor Model' },
];

export function MonitoringPointsPage() {
  const dispatch = useAppDispatch();
  const machines = useAppSelector((state) => state.machines.items);
  const {
    items,
    page,
    totalPages,
    total,
    sortBy,
    order,
    status,
    mutationStatus,
    error,
  } = useAppSelector((state) => state.monitoringPoints);

  const [createOpen, setCreateOpen] = useState(false);
  const [sensorOpen, setSensorOpen] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<MonitoringPointDto | null>(null);
  const [createForm, setCreateForm] = useState({ machineId: '', name: '' });
  const [sensorForm, setSensorForm] = useState({
    sensorId: '',
    model: SensorModel.HFPlus as SensorModel,
  });

  useEffect(() => {
    dispatch(fetchMachines());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchMonitoringPoints({ page, sortBy, order, limit: 5 }));
  }, [dispatch, page, sortBy, order]);

  const selectedMachine: MachineDto | undefined = useMemo(
    () => machines.find((machine) => machine.id === createForm.machineId),
    [machines, createForm.machineId]
  );

  const allowedModelsForSelectedPoint = useMemo(() => {
    if (!selectedPoint) return ALL_SENSOR_MODELS;
    return ALL_SENSOR_MODELS.filter((model) =>
      isSensorAllowedForMachine(selectedPoint.machineType, model)
    );
  }, [selectedPoint]);

  const machinePointCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const point of items) {
      counts.set(point.machineId, (counts.get(point.machineId) ?? 0) + 1);
    }
    return counts;
  }, [items]);

  const openCreate = () => {
    dispatch(clearMonitoringPointsError());
    setCreateForm({
      machineId: machines[0]?.id ?? '',
      name: '',
    });
    setCreateOpen(true);
  };

  const openSensorDialog = (point: MonitoringPointDto) => {
    dispatch(clearMonitoringPointsError());
    setSelectedPoint(point);
    const models = ALL_SENSOR_MODELS.filter((model) =>
      isSensorAllowedForMachine(point.machineType, model)
    );
    setSensorForm({
      sensorId: '',
      model: models[0] ?? SensorModel.HFPlus,
    });
    setSensorOpen(true);
  };

  const handleSort = (field: MonitoringPointSortField) => {
    const nextOrder = sortBy === field && order === 'asc' ? 'desc' : 'asc';
    dispatch(setMonitoringPointsSort({ sortBy: field, order: nextOrder }));
  };

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    if (!createForm.machineId) return;

    const result = await dispatch(
      createMonitoringPoint({
        machineId: createForm.machineId,
        payload: { name: createForm.name },
      })
    );

    if (createMonitoringPoint.fulfilled.match(result)) {
      setCreateOpen(false);
      dispatch(fetchMonitoringPoints({ page: 1, sortBy, order, limit: 5 }));
      dispatch(setMonitoringPointsPage(1));
    }
  };

  const handleAssociateSensor = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedPoint) return;

    const result = await dispatch(
      associateSensor({
        pointId: selectedPoint.id,
        payload: sensorForm,
      })
    );

    if (associateSensor.fulfilled.match(result)) {
      setSensorOpen(false);
      setSelectedPoint(null);
    }
  };

  const handleDeletePoint = async (point: MonitoringPointDto) => {
    const confirmed = window.confirm(`Delete monitoring point "${point.name}"?`);
    if (!confirmed) return;
    const result = await dispatch(deleteMonitoringPoint(point.id));
    if (deleteMonitoringPoint.fulfilled.match(result)) {
      dispatch(fetchMonitoringPoints({ page, sortBy, order, limit: 5 }));
    }
  };

  const handleRemoveSensor = async (point: MonitoringPointDto) => {
    const confirmed = window.confirm(`Remove sensor "${point.sensorId}" from "${point.name}"?`);
    if (!confirmed) return;
    await dispatch(removeSensor(point.id));
  };

  return (
    <Stack spacing={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" gap={2} flexWrap="wrap">
        <Box>
          <Typography variant="h4">Monitoring Points</Typography>
          <Typography variant="body2" color="text.secondary">
            {total} total · 5 per page · sort by any column
          </Typography>
        </Box>
        <Button variant="contained" onClick={openCreate} disabled={machines.length === 0}>
          New monitoring point
        </Button>
      </Box>

      {machines.length === 0 && (
        <Alert severity="info">Create a machine first before adding monitoring points.</Alert>
      )}

      {selectedMachine && (machinePointCounts.get(selectedMachine.id) ?? 0) < 2 && createOpen && (
        <Alert severity="info">
          Tip: each machine should have at least two monitoring points.
        </Alert>
      )}

      {error && <Alert severity="error">{error}</Alert>}

      <Table size="small">
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell key={column.id} sortDirection={sortBy === column.id ? order : false}>
                <TableSortLabel
                  active={sortBy === column.id}
                  direction={sortBy === column.id ? order : 'asc'}
                  onClick={() => handleSort(column.id)}
                >
                  {column.label}
                </TableSortLabel>
              </TableCell>
            ))}
            <TableCell>Sensor ID</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {status === 'loading' && items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6}>Loading...</TableCell>
            </TableRow>
          ) : items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6}>No monitoring points yet.</TableCell>
            </TableRow>
          ) : (
            items.map((point) => (
              <TableRow key={point.id} hover>
                <TableCell>{point.machineName}</TableCell>
                <TableCell>{point.machineType}</TableCell>
                <TableCell>{point.name}</TableCell>
                <TableCell>{point.sensorModel ?? '—'}</TableCell>
                <TableCell>{point.sensorId ?? '—'}</TableCell>
                <TableCell align="right">
                  {!point.sensorId ? (
                    <IconButton
                      aria-label="associate sensor"
                      onClick={() => openSensorDialog(point)}
                    >
                      <SensorsIcon />
                    </IconButton>
                  ) : (
                    <Button size="small" onClick={() => handleRemoveSensor(point)}>
                      Remove sensor
                    </Button>
                  )}
                  <IconButton aria-label="delete" onClick={() => handleDeletePoint(point)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <Box display="flex" justifyContent="flex-end">
        <Pagination
          page={page}
          count={totalPages}
          onChange={(_event, value) => dispatch(setMonitoringPointsPage(value))}
          color="primary"
        />
      </Box>

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create monitoring point</DialogTitle>
        <Box component="form" onSubmit={handleCreate}>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <FormControl fullWidth required>
                <InputLabel id="machine-label">Machine</InputLabel>
                <Select
                  labelId="machine-label"
                  label="Machine"
                  value={createForm.machineId}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, machineId: e.target.value }))
                  }
                >
                  {machines.map((machine) => (
                    <MenuItem key={machine.id} value={machine.id}>
                      {machine.name} ({machine.type})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Monitoring point name"
                value={createForm.name}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
                required
                fullWidth
              />
              {selectedMachine?.type === MachineType.Pump && (
                <Alert severity="warning">
                  Pump machines can only use HF+ sensors (TcAg/TcAs are blocked).
                </Alert>
              )}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={mutationStatus === 'loading'}>
              Create
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog open={sensorOpen} onClose={() => setSensorOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Associate sensor</DialogTitle>
        <Box component="form" onSubmit={handleAssociateSensor}>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {selectedPoint
                  ? `${selectedPoint.machineName} (${selectedPoint.machineType}) · ${selectedPoint.name}`
                  : ''}
              </Typography>
              <TextField
                label="Sensor ID"
                value={sensorForm.sensorId}
                onChange={(e) =>
                  setSensorForm((prev) => ({ ...prev, sensorId: e.target.value }))
                }
                required
                fullWidth
                helperText="Must be unique across the system"
              />
              <FormControl fullWidth>
                <InputLabel id="sensor-model-label">Sensor model</InputLabel>
                <Select
                  labelId="sensor-model-label"
                  label="Sensor model"
                  value={sensorForm.model}
                  onChange={(e) =>
                    setSensorForm((prev) => ({
                      ...prev,
                      model: e.target.value as SensorModel,
                    }))
                  }
                >
                  {allowedModelsForSelectedPoint.map((model) => (
                    <MenuItem key={model} value={model}>
                      {model}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {selectedPoint?.machineType === MachineType.Pump && (
                <Alert severity="info">TcAg and TcAs are hidden for Pump machines.</Alert>
              )}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSensorOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={mutationStatus === 'loading'}>
              Associate
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Stack>
  );
}

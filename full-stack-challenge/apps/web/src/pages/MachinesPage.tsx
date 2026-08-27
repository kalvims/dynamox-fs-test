import { FormEvent, useEffect, useState } from 'react';
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
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import DeleteIconImport from '@mui/icons-material/Delete';
import EditIconImport from '@mui/icons-material/Edit';
import { MachineType, type MachineDto } from '@dynamox/shared';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import {
  clearMachinesError,
  createMachine,
  deleteMachine,
  fetchMachines,
  updateMachine,
} from '../features/machines/machinesSlice';
import { resolveMuiIcon } from '../utils/resolveMuiIcon';

const DeleteIcon = resolveMuiIcon(DeleteIconImport);
const EditIcon = resolveMuiIcon(EditIconImport);

const emptyForm = {
  name: '',
  type: MachineType.Pump as MachineType,
};

export function MachinesPage() {
  const dispatch = useAppDispatch();
  const { items, status, error, mutationStatus } = useAppSelector((state) => state.machines);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MachineDto | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    dispatch(fetchMachines());
  }, [dispatch]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    dispatch(clearMachinesError());
    setDialogOpen(true);
  };

  const openEdit = (machine: MachineDto) => {
    setEditing(machine);
    setForm({ name: machine.name, type: machine.type });
    dispatch(clearMachinesError());
    setDialogOpen(true);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (editing) {
      const result = await dispatch(
        updateMachine({ id: editing.id, payload: { name: form.name, type: form.type } })
      );
      if (updateMachine.fulfilled.match(result)) {
        setDialogOpen(false);
      }
      return;
    }

    const result = await dispatch(createMachine(form));
    if (createMachine.fulfilled.match(result)) {
      setDialogOpen(false);
    }
  };

  const handleDelete = async (machine: MachineDto) => {
    const confirmed = window.confirm(`Delete machine "${machine.name}"?`);
    if (!confirmed) return;
    dispatch(deleteMachine(machine.id));
  };

  return (
    <Stack spacing={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" gap={2} flexWrap="wrap">
        <Typography variant="h4">Machines</Typography>
        <Button variant="contained" onClick={openCreate}>
          New machine
        </Button>
      </Box>

      {error && <Alert severity="error">{error}</Alert>}

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Updated</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {status === 'loading' && items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4}>Loading...</TableCell>
            </TableRow>
          ) : items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4}>No machines yet. Create the first one.</TableCell>
            </TableRow>
          ) : (
            items.map((machine) => (
              <TableRow key={machine.id} hover>
                <TableCell>{machine.name}</TableCell>
                <TableCell>{machine.type}</TableCell>
                <TableCell>{new Date(machine.updatedAt).toLocaleString()}</TableCell>
                <TableCell align="right">
                  <IconButton aria-label="edit" onClick={() => openEdit(machine)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton aria-label="delete" onClick={() => handleDelete(machine)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editing ? 'Edit machine' : 'Create machine'}</DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <TextField
                label="Name"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                required
                fullWidth
              />
              <FormControl fullWidth>
                <InputLabel id="machine-type-label">Type</InputLabel>
                <Select
                  labelId="machine-type-label"
                  label="Type"
                  value={form.type}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, type: e.target.value as MachineType }))
                  }
                >
                  <MenuItem value={MachineType.Pump}>Pump</MenuItem>
                  <MenuItem value={MachineType.Fan}>Fan</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={mutationStatus === 'loading'}>
              {editing ? 'Save' : 'Create'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Stack>
  );
}

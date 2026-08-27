import { prisma } from '../../lib/prisma';
import { AppError } from '../../shared/errors';
import type { CreateMachineInput, UpdateMachineInput } from './machines.schemas';

function mapMachine(machine: {
  id: string;
  name: string;
  type: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: machine.id,
    name: machine.name,
    type: machine.type,
    createdAt: machine.createdAt.toISOString(),
    updatedAt: machine.updatedAt.toISOString(),
  };
}

export async function listMachines() {
  const machines = await prisma.machine.findMany({
    orderBy: { createdAt: 'desc' },
  });
  return machines.map(mapMachine);
}

export async function getMachine(id: string) {
  const machine = await prisma.machine.findUnique({ where: { id } });
  if (!machine) {
    throw new AppError(404, 'Machine not found');
  }
  return mapMachine(machine);
}

export async function createMachine(input: CreateMachineInput) {
  const machine = await prisma.machine.create({ data: input });
  return mapMachine(machine);
}

export async function updateMachine(id: string, input: UpdateMachineInput) {
  await getMachine(id);
  const machine = await prisma.machine.update({
    where: { id },
    data: input,
  });
  return mapMachine(machine);
}

export async function deleteMachine(id: string) {
  await getMachine(id);
  await prisma.machine.delete({ where: { id } });
}

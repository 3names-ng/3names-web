type Listener = (event: any, error?: Error | null) => void;

const registered = new Map<string, Listener>();

export function defineTask(taskName: string, taskFunction: Listener): void {
  registered.set(taskName, taskFunction);
}

export async function isTaskRegisteredAsync(taskName: string): Promise<boolean> {
  return registered.has(taskName);
}

export async function getRegisteredTasksAsync(): Promise<any[]> {
  return Array.from(registered.keys()).map((name) => ({ name }));
}

export async function cancelTaskAsync(taskName: string): Promise<void> {
  registered.delete(taskName);
}

export async function cancelAllTasksAsync(): Promise<void> {
  registered.clear();
}

export function hasTask(taskName: string): boolean {
  return registered.has(taskName);
}

export const TaskManager = {
  defineTask,
  isTaskRegisteredAsync,
  getRegisteredTasksAsync,
  cancelTaskAsync,
  cancelAllTasksAsync,
  hasTask,
};

export default TaskManager;

export interface INopePromise<T, E = any> extends Promise<T> {
  cancel(reason: E): void;
  taskId: string;
}

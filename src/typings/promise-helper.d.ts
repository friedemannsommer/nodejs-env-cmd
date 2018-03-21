export type ResolveFn<T = void> = (value?: T) => void
export type RejectFn<T = Error> = (error: T) => void

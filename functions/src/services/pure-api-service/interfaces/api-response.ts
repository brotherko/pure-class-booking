export type Error = {
  code: number,
  message: string,
}

export type ApiResponse<T> = {
  error: Error,
  data: T
}

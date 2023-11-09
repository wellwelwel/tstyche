export type FileResultStatus = ResultStatus.Runs | ResultStatus.Passed | ResultStatus.Failed;

export const enum ResultStatus {
  Runs = "runs",
  Passed = "passed",
  Failed = "failed",
  Skipped = "skipped",
  Todo = "todo",
}

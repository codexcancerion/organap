export type SupabaseErrorLike = {
  code?: string;
  message: string;
};

export type DbErrorMappingOptions = {
  entityLabel: string;
  uniqueMessage?: string;
  foreignKeyDeleteMessage?: string;
  checkConstraintMessage?: string;
};

/**
 * Map PostgreSQL / PostgREST error codes into concise, actionable UI messages.
 */
export function mapSupabaseMutationError(
  error: SupabaseErrorLike,
  options: DbErrorMappingOptions,
): string {
  if (error.code === "23505" && options.uniqueMessage) {
    return options.uniqueMessage;
  }

  if (error.code === "23503" && options.foreignKeyDeleteMessage) {
    return options.foreignKeyDeleteMessage;
  }

  if (error.code === "23514" && options.checkConstraintMessage) {
    return options.checkConstraintMessage;
  }

  if (error.code === "42501") {
    return `You do not have permission to modify ${options.entityLabel}.`;
  }

  return error.message;
}

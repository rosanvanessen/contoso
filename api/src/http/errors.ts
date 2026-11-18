/**
 * Every error response uses the same envelope (see docs/adr/0002-error-envelope.md):
 *   { "error": { "code": "NOT_FOUND", "message": "Member M-9999 not found", "details": [...] } }
 */
export type ErrorCode = 'BAD_REQUEST' | 'NOT_FOUND' | 'UNPROCESSABLE' | 'METHOD_NOT_ALLOWED' | 'INTERNAL';

const STATUS: Record<ErrorCode, number> = {
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  UNPROCESSABLE: 422,
  INTERNAL: 500,
};

export class ApiError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details?: string[];
  constructor(code: ErrorCode, message: string, details?: string[]) {
    super(message);
    this.code = code;
    this.status = STATUS[code];
    this.details = details;
  }

  toBody() {
    return { error: { code: this.code, message: this.message, ...(this.details ? { details: this.details } : {}) } };
  }
}

export const notFound = (what: string) => new ApiError('NOT_FOUND', `${what} not found`);
export const badRequest = (message: string, details?: string[]) => new ApiError('BAD_REQUEST', message, details);
export const unprocessable = (message: string) => new ApiError('UNPROCESSABLE', message);

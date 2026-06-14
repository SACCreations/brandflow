import { UseFormSetError } from 'react-hook-form';

/**
 * Maps standard BrandFlow backend validation arrays to react-hook-form errors.
 * Backend error format: ["email: Invalid email", "password: Too short"]
 */
export function mapBackendValidationErrorsToForm(
  error: any,
  setError: UseFormSetError<any>,
): boolean {
  const responseData = error.response?.data;
  if (responseData && Array.isArray(responseData.message)) {
    responseData.message.forEach((msg: string) => {
      const parts = msg.split(':');
      if (parts.length >= 2) {
        const field = parts[0]?.trim();
        if (field) {
          const message = parts.slice(1).join(':').trim();
          setError(field, { type: 'manual', message });
        }
      }
    });
    return true;
  }
  return false;
}

import { ValidateBy, ValidationOptions, buildMessage } from 'class-validator';

export function isFutureDate(value: unknown): boolean {
  return typeof value === 'string' && new Date(value).getTime() > Date.now();
}

// Compares against the time of each request, not the time the app started.
export function IsFutureDate(options?: ValidationOptions): PropertyDecorator {
  return ValidateBy(
    {
      name: 'isFutureDate',
      validator: {
        validate: isFutureDate,
        defaultMessage: buildMessage(
          (prefix) => `${prefix}$property must be a future date`,
          options,
        ),
      },
    },
    options,
  );
}

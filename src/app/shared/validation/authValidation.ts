import { SchemaPath } from '@angular/forms/signals';
import { required, email, minLength } from '@angular/forms/signals';
import { ILogin, ISignUp } from '../../core/interfaces/auth';
import { GLOBAL_CONSTANTS } from '../../core/constants/globalConstants';

export function loginFormValidation(schemaPath: { [K in keyof ILogin]: SchemaPath<ILogin[K]> }) {
  // email
  required(schemaPath.email, {
    message: GLOBAL_CONSTANTS.VALIDATION.CUSTOMER_EMAIL_MESSAGE,
  });
  email(schemaPath.email, {
    message: GLOBAL_CONSTANTS.VALIDATION.CUSTOMER_EMAIL_VALID_MESSAGE,
  });

  // password
  required(schemaPath.password, { message: 'Password is required' });
  minLength(schemaPath.password, 5, {
    message: GLOBAL_CONSTANTS.VALIDATION.CUSTOMER_NAME_LENGTH_MESSAGE(5),
  });
}
export function signupFormValidation(schemaPath: { [K in keyof ISignUp]: SchemaPath<ISignUp[K]> }) {
  // firstName
  required(schemaPath.firstName, { message: 'First name is required' });
  minLength(schemaPath.firstName, 2, { message: GLOBAL_CONSTANTS.VALIDATION.CUSTOMER_NAME_LENGTH_MESSAGE(2) });

  // lastName
  required(schemaPath.lastName, { message: 'Last name is required' });
  minLength(schemaPath.lastName, 2, { message: GLOBAL_CONSTANTS.VALIDATION.CUSTOMER_NAME_LENGTH_MESSAGE(2) });

  // email
  required(schemaPath.email, { message: GLOBAL_CONSTANTS.VALIDATION.CUSTOMER_EMAIL_MESSAGE });
  email(schemaPath.email, { message: GLOBAL_CONSTANTS.VALIDATION.CUSTOMER_EMAIL_VALID_MESSAGE });

  // password
  required(schemaPath.password, { message: GLOBAL_CONSTANTS.VALIDATION.PASSWORD });
  minLength(schemaPath.password, 5, { message: GLOBAL_CONSTANTS.VALIDATION.PASSWORD_LENGTH(5) });

  // dateOfBirth
  required(schemaPath.dateOfBirth, { message: 'Date of birth is required' });
}

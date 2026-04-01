import { Logger } from './logger';

export class Validator {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(email);
    
    if (!isValid) {
      this.logger.warn(`Invalid email: ${email}`);
    }
    
    return isValid;
  }

  validateRequired(value: any, fieldName: string): boolean {
    if (!value) {
      this.logger.error(`Required field missing: ${fieldName}`);
      return false;
    }
    return true;
  }
}

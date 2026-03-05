import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { AbstractControl, ValidationErrors } from '@angular/forms';

@Component({
  selector: 'app-error-message',
  templateUrl: './error-message.component.html',
  styleUrls: ['./error-message.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class ErrorMessageComponent {
  @Input() control!: AbstractControl | null; // Контроль форми
  @Input() customMessages: { [key: string]: string } = {}; // Кастомні повідомлення

  get errorMessage(): string | null {
    if (this.control && this.control.errors && (this.control.touched || this.control.dirty)) {
      const errors: ValidationErrors = this.control.errors;
      const firstErrorKey = Object.keys(errors)[0];
      return this.customMessages[firstErrorKey] || this.getDefaultMessage(firstErrorKey);
    }
    return null;
  }

  private getDefaultMessage(errorKey: string): string {
    const defaultMessages: { [key: string]: string } = {
      required: 'This field is required.',
      minlength: 'The value is too short.',
      maxlength: 'The value is too long.',
      pattern: 'Invalid format.',
      min: 'The value is too low.',
      max: 'The value is too high.'
    };
    return defaultMessages[errorKey] || 'Invalid field.';
  }
}

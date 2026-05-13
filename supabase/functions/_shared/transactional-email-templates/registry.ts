/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { template as passwordResetTemplate } from './password-reset.tsx'
import { template as signupVerificationTemplate } from './signup-verification.tsx'
import { template as bookingConfirmationTemplate } from './booking-confirmation.tsx'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: any) => string)
  displayName?: string
  previewData?: Record<string, any>
  to?: string
}

export const TEMPLATES: Record<string, TemplateEntry> = {
  'password-reset': passwordResetTemplate,
  'signup-verification': signupVerificationTemplate,
  'booking-confirmation': bookingConfirmationTemplate,
}

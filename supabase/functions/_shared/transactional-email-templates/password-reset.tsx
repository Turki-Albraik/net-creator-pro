/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface PasswordResetEmailProps {
  name?: string
  resetUrl?: string
  siteName?: string
}

const PasswordResetEmail = ({
  name = 'there',
  resetUrl = '#',
  siteName = 'سِـكَّـة',
}: PasswordResetEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Reset your {siteName} password</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Reset your password</Heading>
        <Text style={text}>
          Hi {name}, we received a request to reset your password for {siteName}.
          Click the button below to choose a new password. This link expires in 60 minutes.
        </Text>
        <Button style={button} href={resetUrl}>
          Reset Password
        </Button>
        <Text style={footer}>
          If you didn't request this, you can safely ignore this email — your password will not change.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: PasswordResetEmail,
  subject: 'Reset your سِـكَّـة password',
  displayName: 'Password Reset',
  previewData: { name: 'Sara', resetUrl: 'https://sikkahsa.online/reset-password?token=preview' },
} satisfies TemplateEntry

const main = { backgroundColor: '#FDFCF5', fontFamily: "'DM Sans', Arial, sans-serif" }
const container = { padding: '24px 28px', maxWidth: '560px' }
const h1 = {
  fontSize: '24px',
  fontWeight: 'bold' as const,
  color: '#1A4332',
  margin: '0 0 18px',
}
const text = {
  fontSize: '15px',
  color: '#2D3748',
  lineHeight: '1.6',
  margin: '0 0 24px',
}
const button = {
  backgroundColor: '#B59410',
  color: '#FDFCF5',
  fontSize: '15px',
  fontWeight: 'bold' as const,
  borderRadius: '14px',
  padding: '14px 28px',
  textDecoration: 'none',
  display: 'inline-block',
}
const footer = { fontSize: '13px', color: '#6B7280', margin: '32px 0 0', lineHeight: '1.5' }

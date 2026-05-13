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

interface SignupVerificationEmailProps {
  name?: string
  verifyUrl?: string
  siteName?: string
}

const SignupVerificationEmail = ({
  name = 'there',
  verifyUrl = '#',
  siteName = 'سِـكَّـة',
}: SignupVerificationEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirm your email for {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Welcome to {siteName}!</Heading>
        <Text style={text}>
          Hi {name}, thanks for creating an account. Please confirm your email address
          to activate your account and start booking train journeys.
        </Text>
        <Button style={button} href={verifyUrl}>
          Verify Email
        </Button>
        <Text style={text}>
          Or copy and paste this link into your browser:
          <br />
          <span style={linkText}>{verifyUrl}</span>
        </Text>
        <Text style={footer}>
          If you didn't create an account with {siteName}, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: SignupVerificationEmail,
  subject: 'Confirm your سِـكَّـة account',
  displayName: 'Signup Verification',
  previewData: {
    name: 'Sara',
    verifyUrl: 'https://sikkahsa.online/verify-email?token=preview',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Arial, sans-serif" }
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
const linkText = { color: '#1A4332', wordBreak: 'break-all' as const, fontSize: '13px' }
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

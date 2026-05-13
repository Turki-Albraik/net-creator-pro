/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface BookingConfirmationEmailProps {
  name?: string
  bookingId?: string
  source?: string
  destination?: string
  trainId?: string
  travelDate?: string
  departureTime?: string
  arrivalTime?: string
  seatNumbers?: string
  totalAmount?: string
  siteName?: string
}

const BookingConfirmationEmail = ({
  name = 'Customer',
  bookingId = 'BK-XXXXXXXX',
  source = '—',
  destination = '—',
  trainId = '—',
  travelDate = '—',
  departureTime = '—',
  arrivalTime = '—',
  seatNumbers = '—',
  totalAmount = '—',
  siteName = 'سِـكَّـة',
}: BookingConfirmationEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your {siteName} booking {bookingId} is confirmed</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Thank you for your booking!</Heading>
        <Text style={text}>Dear {name},</Text>
        <Text style={text}>
          Your reservation has been confirmed. Please find your booking details below.
        </Text>

        <Section style={card}>
          <Text style={cardTitle}>Booking #{bookingId}</Text>
          <Hr style={hr} />
          <Row label="Route" value={`${source} → ${destination}`} />
          <Row label="Train" value={trainId} />
          <Row label="Date" value={travelDate} />
          <Row label="Departure" value={departureTime} />
          <Row label="Arrival" value={arrivalTime} />
          <Row label="Seat(s)" value={seatNumbers} />
          <Row label="Total Paid" value={totalAmount} />
        </Section>

        <Heading as="h2" style={h2}>Travel Instructions</Heading>
        <Text style={listItem}>• Please arrive at the train station at least <b>30 minutes</b> before departure time.</Text>
        <Text style={listItem}>• Carry the same ID or passport used during booking.</Text>
        <Text style={listItem}>• Present your boarding ticket at the station gate when requested.</Text>
        <Text style={listItem}>• Follow the coach and seat number indicated on your ticket.</Text>
        <Text style={listItem}>• For any changes or inquiries, kindly contact us before the departure time.</Text>

        <Text style={text}>We wish you a safe and pleasant journey.</Text>
        <Text style={footer}>Best regards,<br />The {siteName} Team</Text>
      </Container>
    </Body>
  </Html>
)

const Row = ({ label, value }: { label: string; value: string }) => (
  <table style={{ width: '100%', borderCollapse: 'collapse', margin: '6px 0' }}>
    <tbody>
      <tr>
        <td style={rowLabel}>{label}</td>
        <td style={rowValue}>{value}</td>
      </tr>
    </tbody>
  </table>
)

export const template = {
  component: BookingConfirmationEmail,
  subject: (data: any) =>
    `Your سِـكَّـة booking ${data?.bookingId ?? ''} is confirmed`.trim(),
  displayName: 'Booking Confirmation',
  previewData: {
    name: 'Sara',
    bookingId: 'BK-AB12CD34',
    source: 'Riyadh',
    destination: 'Dammam',
    trainId: 'HHR-204',
    travelDate: 'May 20, 2026',
    departureTime: '08:30',
    arrivalTime: '11:45',
    seatNumbers: '02-05A',
    totalAmount: 'SAR 220.00',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Arial, sans-serif" }
const container = { padding: '24px 28px', maxWidth: '600px' }
const h1 = {
  fontSize: '24px',
  fontWeight: 'bold' as const,
  color: '#1A4332',
  margin: '0 0 18px',
}
const h2 = {
  fontSize: '17px',
  fontWeight: 'bold' as const,
  color: '#1A4332',
  margin: '24px 0 12px',
}
const text = {
  fontSize: '15px',
  color: '#2D3748',
  lineHeight: '1.6',
  margin: '0 0 16px',
}
const listItem = {
  fontSize: '14px',
  color: '#2D3748',
  lineHeight: '1.6',
  margin: '0 0 8px',
}
const card = {
  backgroundColor: '#FAF7EC',
  border: '1px solid #E5DDB8',
  borderRadius: '12px',
  padding: '18px 20px',
  margin: '16px 0 24px',
}
const cardTitle = {
  fontSize: '14px',
  fontWeight: 'bold' as const,
  color: '#1A4332',
  letterSpacing: '1px',
  textTransform: 'uppercase' as const,
  margin: '0 0 8px',
}
const hr = { borderColor: '#E5DDB8', margin: '8px 0 12px' }
const rowLabel = {
  fontSize: '12px',
  color: '#6B7280',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  padding: '4px 0',
  width: '38%',
}
const rowValue = {
  fontSize: '14px',
  color: '#1A4332',
  fontWeight: 600 as const,
  padding: '4px 0',
  textAlign: 'right' as const,
}
const footer = { fontSize: '13px', color: '#6B7280', margin: '24px 0 0', lineHeight: '1.5' }

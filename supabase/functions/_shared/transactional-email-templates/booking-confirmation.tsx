/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface BoardingPass {
  name: string
  seat: string
  coach?: string
  travelClass?: string
}

interface BookingConfirmationEmailProps {
  name?: string
  bookingId?: string
  source?: string
  destination?: string
  trainId?: string
  travelDate?: string
  departureTime?: string
  arrivalTime?: string
  totalAmount?: string
  passes?: BoardingPass[]
  barcodeDataUrl?: string
  siteName?: string
  contactEmail?: string
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
  totalAmount = '—',
  passes = [],
  barcodeDataUrl = '',
  siteName = 'سِـكَّـة',
  contactEmail = 'sikkahsa@gmail.com',
}: BookingConfirmationEmailProps) => {
  const list = passes.length > 0 ? passes : [{ name, seat: '—' }]
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Your {siteName} booking {bookingId} is confirmed</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Thank you for your booking!</Heading>
          <Text style={text}>Dear {name},</Text>
          <Text style={text}>
            Please find attached your train ticket for the upcoming journey.
          </Text>

          {list.map((p, i) => (
            <BoardingPassCard
              key={i}
              index={i}
              total={list.length}
              pass={p}
              source={source}
              destination={destination}
              trainId={trainId}
              travelDate={travelDate}
              departureTime={departureTime}
              arrivalTime={arrivalTime}
              bookingId={bookingId}
              barcodeDataUrl={barcodeDataUrl}
              siteName={siteName}
            />
          ))}

          <Heading as="h2" style={h2}>Travel Instructions</Heading>
          <Text style={text}>Kindly review the following travel instructions before departure:</Text>
          <Text style={listItem}>• Please arrive at the train station at least <b>30 minutes</b> before departure time.</Text>
          <Text style={listItem}>• Show your boarding ticket at the station gate when requested.</Text>
          <Text style={listItem}>• Please follow the coach and seat number indicated on your ticket.</Text>
          <Text style={listItem}>• For any changes or inquiries, kindly contact us on (<b>{contactEmail}</b>) before the departure time.</Text>

          <Text style={text}>We wish you a safe and pleasant journey.</Text>
          <Text style={footer}>Best regards,<br />The {siteName} Team</Text>
        </Container>
      </Body>
    </Html>
  )
}

const BoardingPassCard = ({
  index,
  total,
  pass,
  source,
  destination,
  trainId,
  travelDate,
  departureTime,
  arrivalTime,
  bookingId,
  barcodeDataUrl,
  siteName,
}: {
  index: number
  total: number
  pass: BoardingPass
  source: string
  destination: string
  trainId: string
  travelDate: string
  departureTime: string
  arrivalTime: string
  bookingId: string
  barcodeDataUrl: string
  siteName: string
}) => (
  <Section style={ticketWrap}>
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <tbody>
        <tr>
          <td style={ticketMain}>
            <Text style={brandName}>{siteName}</Text>
            <Text style={brandSmall}>Sikkah · Boarding Pass {index + 1} of {total}</Text>
            <Text style={routeLine}>{source} → {destination}</Text>

            <table style={{ width: '100%', borderCollapse: 'collapse', margin: '6px 0 12px' }}>
              <tbody>
                <tr>
                  <td style={cellHalf}><span style={cellLabel}>Train</span><br /><span style={cellValue}>{trainId}</span></td>
                  <td style={cellHalf}><span style={cellLabel}>Date</span><br /><span style={cellValue}>{travelDate}</span></td>
                </tr>
                <tr>
                  <td style={cellHalf}><span style={cellLabel}>Departure</span><br /><span style={cellValue}>{departureTime}</span></td>
                  <td style={cellHalf}><span style={cellLabel}>Arrival</span><br /><span style={cellValue}>{arrivalTime}</span></td>
                </tr>
              </tbody>
            </table>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={rowLabel}>Passenger</td>
                  <td style={rowValue}>{pass.name}</td>
                </tr>
                {pass.travelClass ? (
                  <tr>
                    <td style={rowLabel}>Class</td>
                    <td style={rowValue}>
                      {pass.travelClass === 'Business' ? '★ ' : ''}{pass.travelClass}{pass.coach ? ` · ${pass.coach}` : ''}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>

            <Text style={seatBox}>SEAT · {pass.seat}</Text>
          </td>
          <td style={stub}>
            <Text style={stubLabel}>Boarding Pass</Text>
            <Text style={stubSeat}>{pass.seat}</Text>
            <Img
              src={`https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(bookingId)}&scale=2&height=18&includetext&textxalign=center&backgroundcolor=F4E9B8`}
              alt={`Barcode ${bookingId}`}
              width="170"
              style={{ display: 'block', margin: '6px auto', background: '#F4E9B8', borderRadius: '8px', padding: '4px' }}
            />
            <Text style={stubBk}>{bookingId}</Text>
          </td>
        </tr>
      </tbody>
    </table>
  </Section>
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
    totalAmount: 'SAR 220.00',
    contactEmail: 'sikkahsa@gmail.com',
    passes: [
      { name: 'Sara Ahmed', seat: '02-05A', coach: 'Coach 02', travelClass: 'Business' },
    ],
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Arial, sans-serif" }
const container = { padding: '24px 28px', maxWidth: '640px' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#1A4332', margin: '0 0 18px' }
const h2 = { fontSize: '17px', fontWeight: 'bold' as const, color: '#1A4332', margin: '24px 0 12px' }
const text = { fontSize: '15px', color: '#2D3748', lineHeight: '1.6', margin: '0 0 16px' }
const listItem = { fontSize: '14px', color: '#2D3748', lineHeight: '1.6', margin: '0 0 8px' }
const footer = { fontSize: '13px', color: '#6B7280', margin: '24px 0 0', lineHeight: '1.5' }

const ticketWrap = {
  background: '#143929',
  borderRadius: '14px',
  border: '1px solid #B59410',
  padding: '0',
  margin: '14px 0 22px',
  overflow: 'hidden' as const,
  color: '#FDFCF5',
}
const ticketMain = { padding: '20px 22px', verticalAlign: 'top' as const, width: '70%' }
const stub = {
  padding: '20px 14px',
  textAlign: 'center' as const,
  borderLeft: '2px dashed rgba(245,229,184,0.55)',
  verticalAlign: 'middle' as const,
  width: '30%',
}
const brandName = { fontFamily: 'Georgia, serif', fontSize: '20px', color: '#F4E9B8', margin: '0', letterSpacing: '1px' }
const brandSmall = { color: '#D4B53A', fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase' as const, margin: '2px 0 0' }
const routeLine = { fontFamily: 'Georgia, serif', fontSize: '24px', fontWeight: 700 as const, margin: '10px 0 12px', color: '#ffffff' }
const cellHalf = { padding: '6px 8px 6px 0', width: '50%', verticalAlign: 'top' as const }
const cellLabel = { color: '#D4B53A', fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase' as const }
const cellValue = { fontSize: '13px', fontWeight: 600 as const, color: '#ffffff' }
const rowLabel = { color: '#D4B53A', fontSize: '10px', letterSpacing: '1.5px', textTransform: 'uppercase' as const, padding: '5px 0', width: '38%' }
const rowValue = { color: '#ffffff', fontWeight: 600 as const, fontSize: '13px', padding: '5px 0', textAlign: 'right' as const }
const seatBox = {
  marginTop: '14px',
  padding: '10px 14px',
  border: '1px solid rgba(181,148,16,0.6)',
  borderRadius: '10px',
  fontFamily: 'monospace',
  letterSpacing: '2px',
  color: '#F4E9B8',
  textAlign: 'center' as const,
  fontWeight: 700 as const,
  fontSize: '14px',
}
const stubLabel = { fontSize: '9px', letterSpacing: '3px', color: '#D4B53A', textTransform: 'uppercase' as const, margin: '0' }
const stubSeat = { fontFamily: 'Georgia, serif', fontSize: '32px', color: '#F4E9B8', margin: '6px 0 4px' }
const stubBk = { fontFamily: 'monospace', fontSize: '10px', color: '#0B1F17', background: '#F4E9B8', padding: '3px 6px', borderRadius: '4px', display: 'inline-block', margin: '4px 0 0' }

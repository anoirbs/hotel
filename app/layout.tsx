import './globals.css';
import { ClientLayout } from '@/components/client-layout';

export const metadata = {
  title: 'Hotel Paradise - Luxury Hotel Booking',
  description: 'Book luxury hotel rooms with ease',
};

export default function RootLayout({ children }: { readonly children: React.ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning={true}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
import './globals.css';

export const metadata = {
  title: 'Hotel Booking App',
  description: 'Book luxury hotel rooms with ease',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
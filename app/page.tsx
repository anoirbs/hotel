'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[600px] flex items-center justify-center">
        <Image
          src="https://images.unsplash.com/photo-1542314831-8d7f238d7f9b" // Hotel exterior
          alt="Luxury Hotel"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute text-center text-white bg-black bg-opacity-50 p-8 rounded">
          <h1 className="text-5xl font-bold mb-4">Welcome to Our Luxury Hotel</h1>
          <p className="text-xl mb-6">Experience unparalleled comfort and style</p>
          <Link href="/rooms" className="bg-secondary text-white px-6 py-3 rounded hover:bg-primary">
            Book Now
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-8 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">Why Choose Us?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <Image
              src="https://images.unsplash.com/photo-1566073771259-6a8506099945" // Room interior
              alt="Comfortable Rooms"
              width={400}
              height={300}
              className="rounded mb-4 mx-auto"
            />
            <h3 className="text-xl font-semibold">Comfortable Rooms</h3>
            <p>Spacious and modern rooms designed for your relaxation.</p>
          </div>
          <div className="text-center">
            <Image
              src="https://images.unsplash.com/photo-1578683010238-c99b7a8a88e1" // Dining
              alt="Fine Dining"
              width={400}
              height={300}
              className="rounded mb-4 mx-auto"
            />
            <h3 className="text-xl font-semibold">Fine Dining</h3>
            <p>Enjoy exquisite meals prepared by top chefs.</p>
          </div>
          <div className="text-center">
            <Image
              src="https://images.unsplash.com/photo-1611892440504-42a792e24d3d" // Spa
              alt="Spa Services"
              width={400}
              height={300}
              className="rounded mb-4 mx-auto"
            />
            <h3 className="text-xl font-semibold">Spa Services</h3>
            <p>Relax and rejuvenate with our world-class spa.</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary text-white py-16 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to Book Your Stay?</h2>
        <p className="mb-6">Explore our rooms or configure your payment settings.</p>
        <div className="flex justify-center gap-4">
          <Link href="/rooms" className="bg-secondary text-white px-6 py-3 rounded hover:bg-white hover:text-primary">
            View Rooms
          </Link>
          <Link href="/login" className="bg-white text-primary px-6 py-3 rounded hover:bg-secondary hover:text-white">
            Login
          </Link>
          <Link href="/signup" className="bg-white text-primary px-6 py-3 rounded hover:bg-secondary hover:text-white">
            Sign Up
          </Link>
          <Link href="/stripe-config" className="bg-white text-primary px-6 py-3 rounded hover:bg-secondary hover:text-white">
            Configure Stripe
          </Link>
        </div>
      </section>
    </main>
  );
}
'use client';

import {
  CardElement,
  Elements,
  useElements,
  useStripe
} from '@stripe/react-stripe-js';
import { StripeElementsOptions, loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';

interface PaymentPopupProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  roomName: string;
  checkIn: string;
  checkOut: string;
  onSuccess: () => void;
  bookingData: {
    roomId: string;
    userName: string;
    userEmail: string;
    checkIn: string;
    checkOut: string;
    specialRequests?: string;
  };
  stripePublishableKey: string | null;
}

function PaymentForm({ 
  amount, 
  roomName, 
  onSuccess, 
  onClose, 
  bookingData,
  stripePublishableKey 
}: Omit<PaymentPopupProps, 'isOpen'>) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  useEffect(() => {
    // Fetch invoice and payment intent client secret
    const fetchInvoice = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/stripe/create-invoice', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            roomId: bookingData.roomId,
            checkIn: bookingData.checkIn,
            checkOut: bookingData.checkOut,
            amount: amount,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create invoice');
        }

        const { clientSecret: secret, invoiceId } = await response.json();
        setClientSecret(secret);
        // Store invoice ID for confirmation
        if (invoiceId) {
          localStorage.setItem('pending_invoice_id', invoiceId);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize payment');
      }
    };

    if (stripe && elements) {
      fetchInvoice();
    }
  }, [stripe, elements, bookingData.roomId, bookingData.checkIn, bookingData.checkOut, amount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      setError('Payment system not ready. Please try again.');
      return;
    }

    setProcessing(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError('Card element not found');
      setProcessing(false);
      return;
    }

    try {
      // Get invoice ID from localStorage
      const invoiceId = localStorage.getItem('pending_invoice_id');
      if (!invoiceId) {
        throw new Error('Invoice ID not found. Please try again.');
      }

      let paymentIntent: any = null;

      if (clientSecret) {
        // Confirm payment with Stripe using payment intent
        const result = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: bookingData.userName,
              email: bookingData.userEmail,
            },
          },
        });
        
        if (result.error) {
          setError(result.error.message || 'Payment failed');
          setProcessing(false);
          return;
        }
        
        paymentIntent = result.paymentIntent;
      } else {
        // If no client secret, we need to pay the invoice directly
        // This shouldn't happen but handle it gracefully
        throw new Error('Payment method not available. Please contact support.');
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Get invoice ID from localStorage
        const invoiceId = localStorage.getItem('pending_invoice_id');
        if (!invoiceId) {
          throw new Error('Invoice ID not found');
        }

        // Confirm booking on backend
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication token not found. Please log in again.');
        }
        
        console.log('Confirming booking with invoice:', invoiceId);
        console.log('Booking data:', bookingData);
        
        const confirmResponse = await fetch('/api/stripe/confirm-invoice', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            invoiceId,
            roomId: bookingData.roomId,
            userName: bookingData.userName,
            userEmail: bookingData.userEmail,
            checkIn: bookingData.checkIn,
            checkOut: bookingData.checkOut,
            specialRequests: bookingData.specialRequests,
          }),
        });

        if (!confirmResponse.ok) {
          const errorData = await confirmResponse.json();
          console.error('Failed to confirm booking:', errorData);
          // Don't clear invoice ID if confirmation failed - user might retry
          throw new Error(errorData.error || 'Failed to confirm booking');
        }

        const bookingResult = await confirmResponse.json();
        console.log('Booking confirmed successfully:', bookingResult);
        
        // Only clear invoice ID after successful confirmation
        localStorage.removeItem('pending_invoice_id');
        
        setProcessing(false);
        onSuccess();
      } else {
        throw new Error('Payment did not succeed. Status: ' + (paymentIntent?.status || 'unknown'));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during payment');
      setProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <span className="font-medium text-gray-700">Room:</span>
          <span className="text-gray-900">{roomName}</span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="font-medium text-gray-700">Dates:</span>
          <span className="text-gray-900">
            {new Date(bookingData.checkIn).toLocaleDateString()} - {new Date(bookingData.checkOut).toLocaleDateString()}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-medium text-gray-700">Total:</span>
          <span className="text-2xl font-bold text-blue-600">${amount.toFixed(2)}</span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Card Details
        </label>
        <div className="border border-gray-300 rounded-lg p-4 bg-white">
          <CardElement options={cardElementOptions} />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={!stripe || processing || !clientSecret}
          className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {processing ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
        </button>
        <button
          type="button"
          onClick={onClose}
          disabled={processing}
          className="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-lg font-semibold hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function PaymentPopup({
  isOpen,
  onClose,
  amount,
  roomName,
  checkIn,
  checkOut,
  onSuccess,
  bookingData,
  stripePublishableKey,
}: PaymentPopupProps) {
  const [stripePromise, setStripePromise] = useState<Promise<any> | null>(null);

  // Initialize Stripe with the publishable key
  useEffect(() => {
    if (isOpen) {
      const publishableKey = stripePublishableKey || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
      if (publishableKey) {
        setStripePromise(loadStripe(publishableKey));
      }
    }
  }, [isOpen, stripePublishableKey]);

  if (!isOpen) return null;

  const options: StripeElementsOptions = {
    mode: 'payment',
    amount: Math.round(amount * 100),
    currency: 'eur',
  };

  // Use the key from localStorage if available, otherwise use env
  const publishableKey = stripePublishableKey || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
  
  if (!publishableKey || !stripePromise) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl p-6 w-full max-w-md">
          <h3 className="text-xl font-bold mb-4">Payment Error</h3>
          <p className="text-red-600 mb-4">Stripe configuration is missing. Please contact support.</p>
          <button
            onClick={onClose}
            className="w-full bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-800">Payment</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <button
          onClick={onClose}
          className="mb-4 text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Return to Booking
        </button>

        <Elements stripe={stripePromise} options={options}>
          <PaymentForm
            amount={amount}
            roomName={roomName}
            checkIn={checkIn}
            checkOut={checkOut}
            onSuccess={onSuccess}
            onClose={onClose}
            bookingData={bookingData}
            stripePublishableKey={stripePublishableKey}
          />
        </Elements>
      </div>
    </div>
  );
}


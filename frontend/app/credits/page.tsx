"use client";

import Image from 'next/image';
import React, { useState} from 'react';
import logo from '/public/images/background.jpg';
import { useRouter } from 'next/navigation';

export default function BalanceUpdatePage() {
  const router = useRouter();
  const [amount, setAmount] = useState<number>(0);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:80';

  const handleCancel = () => {
    router.push('/all-submissions');
  };
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      setAmount(value);
    }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    const authData = JSON.parse(localStorage.getItem('authData') || '{}');
    const token = authData.token;

    const transactionData = {
      transactionCost: amount,
      creditsPurchased: amount
    };
    console.log(JSON.stringify(transactionData));

    try {
      const response = await fetch(`${apiUrl}/api/transaction/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transactionData),
      });

      if (response.ok) {
        router.push('/all-submissions');
      } else {
        const errorData = await response.json();
        console.error('Failed to update balance:', errorData.message);
      }
    } catch (error) {
      console.error('Error during balance update:', error);
    }
  };
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-lg w-full">
        <Image
          src={logo}
          alt="Company Logo"
          width={300}
          height={300} 
          className="mx-auto mb-6"
        />
        <form className="space-y-4" onSubmit={handleConfirm}>
          <div className="flex flex-col items-center space-y-4">
            <div className="flex flex-col">
              <label htmlFor="amount" className="text-gray-600">
                Amount in $:
              </label>
              <input
                type="number"
                id="amount"
                name="amount"
                value={amount}
                onChange={handleAmountChange}
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 w-36 text-black"
              />
            </div>
            <div className="flex flex-col">
              <label htmlFor="credits" className="text-gray-600">
                Credits:
              </label>
              <input
                type="number"
                id="credits"
                name="credits"
                value={amount} // 1:1 ratio with the amount
                readOnly
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 w-36 text-black"
              />
            </div>
          </div>
          <div className="flex justify-center space-x-4 mt-4">
            <button
              type="submit"
              className="bg-[#f5e1c0] px-4 py-2 rounded-lg shadow-md hover:bg-[#e7d3b0]"
            >
              Confirm
            </button>
            <button
              type="button"
              className="bg-red-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-red-600"
              onClick={handleCancel}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
    );
}

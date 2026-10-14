"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

export default function ResultPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:80';
  const [result, setResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    const fetchResult = async () => {
      const authData = JSON.parse(localStorage.getItem('authData') || '{}');
      const token = authData.token;

      try {
        const response = await fetch(`${apiUrl}/api/result/${params.id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`, // Include the token in the headers
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setResult(data);
        } else {
          const errorData = await response.json();
          setErrorMessage(errorData.message || 'Failed to load result.');
        }
      } catch (error) {
        console.error('Error fetching result:', error);
        setErrorMessage('An error occurred. Please try again later.');
      }
    };

    fetchResult();
  }, [params.id, apiUrl]);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">RESULT</h1>

      {errorMessage && (
        <div className="text-red-500 mb-4">{errorMessage}</div>
      )}

      {result ? (
        <pre className="bg-gray-100 p-4 rounded-lg shadow-lg text-black">
          {JSON.stringify(result, null, 2)}
        </pre>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}

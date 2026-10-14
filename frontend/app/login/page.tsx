"use client";


import Image from 'next/image';
import React, { useState } from 'react';
import logo from '/public/images/background.jpg';
import { useRouter } from 'next/navigation';
import { useUser } from '../context/UserContext';
import axios from 'axios';


export default function LoginPage(){
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:80';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();
  const { setUsername: setGlobalUsername } = useUser(); // Get setUsername from the context
  

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();


  if (email === '' || password === '') {
    setErrorMessage('Please enter both username and password.');
    return;
  }

  try {
    // Replace this URL with your actual login API endpoint
    const response = await fetch(`${apiUrl}/api/user/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Response data:', data); // Debugging: check the response data
      if (data.token) {
        setGlobalUsername(email); // Set the global username context
        // Store the token in localStorage or cookies (depending on your needs)
          localStorage.setItem('authData', JSON.stringify(data));
        router.push('/all-submissions'); // Redirect to the all-submissions page
      } else {
        setErrorMessage(data.message || 'Incorrect username or password. Please try again.');
      }
    } else {
      setErrorMessage('Failed to log in. Please try again.');
    }
  } catch (error) {
    console.error('Login error:', error);
    setErrorMessage('An error occurred. Please try again later.');
  }
};
    return(
       
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-sm">
        <Image
          src={logo}
          alt="Company Logo"
          width={300}
          height={300}
          className="mx-auto mb-6"
        />
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="flex flex-col">
            <label htmlFor="email" className="mb-1 text-gray-600">
              Email:
            </label>
            <input
              type="text"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-black"
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="password" className="mb-1 text-gray-600">
              Password:
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-black"
            />
          </div>
          <div className="flex justify-between mt-4">
            <button
              type="submit"
              className="bg-[#f5e1c0] px-4 py-2 rounded-lg shadow-md hover:bg-[#e7d3b0]"
            >
              Login
            </button>
            <button
              type="button"
              className="bg-red-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-red-600"
              onClick={() => {
                setEmail('');
                setPassword('');
                setErrorMessage('');
              }}
            >
              Cancel
            </button>
          </div>
          {/* Error message */}
          {errorMessage && (
            <p className="text-red-500 mt-4 text-center">{errorMessage}</p>
          )}
        </form>
      </div>
    </div>
  );
}

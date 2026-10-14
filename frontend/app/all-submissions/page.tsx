// app/all-submissions/page.tsx

"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';


interface Task {
  status: string;
  metadataFileName: string;
  inputDataFileName: string;
  _id: string;
  createdAt: string;
  updatedAt: string;
}

interface Submission {
  submissionId: string;
  name: string;
  createdAt: string;
  status: string;
  tasks: Task[];
}


export default function AllSubmissionsPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:80';
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();



    // Fetch submissions from the API
    const fetchSubmissions = async () => {
      const authData = JSON.parse(localStorage.getItem('authData') || '{}');
      const token = authData.token;
      const isAdmin = authData.is_admin;
        // Debugging: Log the token and isAdmin values
      console.log('Token:', token);
      console.log('Is Admin:', isAdmin);

      if (!token) {
        console.error('No token found');
        setErrorMessage('Unauthorized: No token found. Please log in again.');
        router.push('/login');
        return;
      }
       
      try {
        // Select the API endpoint based on whether the user is an admin or not
        const endpoint = isAdmin ? '/api/submission/' : '/api/submission/my-submissions';
        const response = await fetch(`${apiUrl}${endpoint}`, {
          method: 'GET', 
          headers: {
            'Authorization': `Bearer ${token}`, // Include the token in the headers
            'Content-Type': 'application/json',
        },
        });
         // Debugging: Log the response status
         console.log('Response status:', response.status);
        
        
        if (response.ok) {
          const data: Submission[] = await response.json();
           // Debugging: Log the data received from the API
           console.log('Submissions:', data);
          setSubmissions(data); // Directly set the data since it's an array
        }  else if (response.status === 401) {
          setErrorMessage('Unauthorized: Please log in again.');
          router.push('/login');
      } else {
          const errorData = await response.json();
          setErrorMessage(errorData.message || 'Failed to load submissions.');
        }
      } catch (error) {
        console.error('Error fetching submissions:', error);
        setErrorMessage('An error occurred. Please try again later.');
      }
    };

    useEffect(() => {
      fetchSubmissions();
    }, [apiUrl, router]);



  const handleNewSubmissions = () => {
    router.push('/new-submission');
  };

  const handleShowEdit = (id: string) => {
    router.push(`/all-submissions/${id}/edit`);
  };

  const handleRun = async (id: string) => {
    const authData = JSON.parse(localStorage.getItem('authData') || '{}');
    const token = authData.token;
    try {
      // Replace with your actual API endpoint for deletion
      const response = await fetch(`${apiUrl}/api/submission/run/${id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`, // Include the token in the headers
          'Content-Type': 'application/json',
      },
      });

      if (response.ok) {
        fetchSubmissions();
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.message || 'Failed to run submission.');
      }
    } catch (error) {
      console.error('Error deleting submission:', error);
      setErrorMessage('An error occurred. Please try again later.');
    }
  };

  const handleViewResults = (id: string) => {
    router.push(`/result/${id}`);
  };

  const handleDelete = async (id: string) => {
    const authData = JSON.parse(localStorage.getItem('authData') || '{}');
    const token = authData.token;
    try {
      // Replace with your actual API endpoint for deletion
      const response = await fetch(`${apiUrl}/api/submission/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`, // Include the token in the headers
          'Content-Type': 'application/json',
      },
      });
      if (response.ok) {
        setSubmissions(submissions.filter(submission => submission.submissionId !== id));
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.message || 'Failed to delete submission.');
      }
    } catch (error) {
      console.error('Error deleting submission:', error);
      setErrorMessage('An error occurred. Please try again later.');
    }
  };

  return (
    <div className="p-8">
    <div className='flex justify-between items-center p-4'>
      <div className='flex-1 flex justify-start'>
        <h1 className="text-2xl font-bold mb-4">My submissions</h1>
      </div>
    </div>
    
    {errorMessage && (
      <div className="text-red-500 mb-4">{errorMessage}</div>
    )}

    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-300 text-black">
        <thead>
          <tr>
            <th className="py-2 px-4 border-b">Name</th>
            <th className="py-2 px-4 border-b">Created On</th>
            <th className="py-2 px-4 border-b">Status</th>
            <th className="py-2 px-4 border-b">Show/Edit</th>
            <th className="py-2 px-4 border-b">Run</th>
            <th className="py-2 px-4 border-b">View/Results</th>
            <th className="py-2 px-4 border-b">Delete</th>
          </tr>
        </thead>
        <tbody>
          {submissions.map(submission => (
            <tr key={submission.submissionId} className="border-t">
              <td className="py-2 px-4 border-b bg-gray-200">{submission.name}</td>
              <td className="py-2 px-4 border-b bg-gray-200">{new Date(submission.createdAt).toLocaleString()}</td>
              <td className="py-2 px-4 border-b bg-gray-200">{submission.status}</td>
              <td className="py-2 px-4 border-b bg-gray-200">
                <button
                  className="bg-yellow-400 px-4 py-2 rounded text-black"
                  onClick={() => handleShowEdit(submission.submissionId)}
                >
                  Show/Edit
                </button>
              </td>
              <td className="py-2 px-4 border-b bg-gray-200">
                <button
                  className="bg-green-300 px-4 py-2 rounded text-black"
                  onClick={() => handleRun(submission.submissionId)}
                >
                  Run
                </button>
              </td>
              <td className="py-2 px-4 border-b bg-gray-200">
                <button
                  className="bg-gray-300 px-4 py-2 rounded"
                  onClick={() => handleViewResults(submission.submissionId)}
                >
                  View/Results
                </button>
              </td>
              <td className="py-2 px-4 border-b bg-gray-200">
                <button
                  className="bg-red-600 px-4 py-2 rounded text-white"
                  onClick={() => handleDelete(submission.submissionId)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <div className="mt-4">
      <button
        className="bg-lime-300 px-4 py-2 rounded"
        onClick={handleNewSubmissions}
      >
        New Problem
      </button>
    </div>
  </div>
  );
}

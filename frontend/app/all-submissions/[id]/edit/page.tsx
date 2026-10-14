"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

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

export default function EditSubmissionPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:80';
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [newName, setNewName] = useState<string>('');
  const [newMetadataFile, setNewMetadataFile] = useState<File | null>(null);
  const [newInputDataFile, setNewInputDataFile] = useState<File | null>(null);
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    const fetchSubmission = async () => {
      const authData = JSON.parse(localStorage.getItem('authData') || '{}');
      const token = authData.token;
      try {
        const response = await fetch(`${apiUrl}/api/submission/${params.id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`, // Include the token in the headers
            'Content-Type': 'application/json',
        },
        });

        if (response.ok) {
          const data: Submission = await response.json();
          setSubmission(data);
          setNewName(data.name); // Pre-fill the form with the existing name
        } else {
          const errorData = await response.json();
          setErrorMessage(errorData.message || 'Failed to load submission.');
        }
      } catch (error) {
        console.error('Error fetching submission:', error);
        setErrorMessage('An error occurred. Please try again later.');
      }
    };

    fetchSubmission();
  }, [params.id, apiUrl]);

  const handleFileUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    setFile: React.Dispatch<React.SetStateAction<File | null>>
  ) => {
    const file = event.target.files?.[0] || null;
    setFile(file);
  }

  const handleSaveChanges = async () => {
    const authData = JSON.parse(localStorage.getItem('authData') || '{}');
    const token = authData.token;
    if (!newName) {
      setErrorMessage('Submission name cannot be empty.');
      return;
    }

   // Create the request body dynamically
    const submissionData: any = { name: newName };

    if (newMetadataFile || newInputDataFile) {
      submissionData.tasks = [{
        metadataFileName: newMetadataFile ? newMetadataFile.name : submission?.tasks[0].metadataFileName,
        inputDataFileName: newInputDataFile ? newInputDataFile.name : submission?.tasks[0].inputDataFileName,
      }];
    }
    

    try {
      const response = await fetch(`${apiUrl}/api/submission/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`, // Include the token in the headers
          'Content-Type': 'application/json',
      },
        body: JSON.stringify(submissionData),
      });

      if (response.ok) {
        setErrorMessage(null);
        router.push('/all-submissions');
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.message || 'Failed to update submission.');
      }
    } catch (error) {
      console.error('Error updating submission:', error);
      setErrorMessage('An error occurred. Please try again later.');
    }
  };

  const handleCancel = () => {
    router.push('/all-submissions');
  };

  return (
    <div className="p-8">
    <div className="mb-8">
      <label htmlFor="submissionName" className="block text-xl font-bold mb-4">
        Submission Name
      </label>
      <input
        id="submissionName"
        type="text"
        value={newName}
        onChange={(e) => setNewName(e.target.value)}
        className="w-full p-2 border rounded text-black"
      />
    </div>

    <div className="grid grid-cols-2 gap-8 mb-8">
      <div>
        <h2 className="text-lg font-bold mb-4">Metadata</h2>
        <div className="border rounded p-4">
          <input
            type="file"
            onChange={(e) => handleFileUpload(e, setNewMetadataFile)}
            className="mb-4"
          />
          {newMetadataFile && (
            <p className="text-black">{newMetadataFile.name} selected</p>
          )}
        </div>
      </div>
      <div>
        <h2 className="text-lg font-bold mb-4">Input Data</h2>
        <div className="border rounded p-4">
          <input
            type="file"
            onChange={(e) => handleFileUpload(e, setNewInputDataFile)}
            className="mb-4"
          />
          {newInputDataFile && (
            <p className="text-black">{newInputDataFile.name} selected</p>
          )}
        </div>
      </div>
    </div>

    <div className="border rounded p-4 mb-4">
      <h2 className="text-lg font-bold mb-4">Edit Submission</h2>
      {errorMessage && (
        <div className="text-red-500 mb-4">{errorMessage}</div>
      )}
      <div className="flex justify-between">
        <button
          onClick={handleSaveChanges}
          className="bg-[#f5e1c0] py-2 px-4 rounded-lg text-black"
        >
          Save Changes
        </button>
        <button
          onClick={handleCancel}
          className="bg-red-500 text-white py-2 px-4 rounded-lg"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
  );
}

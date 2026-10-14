"use client";

import React, { useState, useEffect} from 'react';
import { useRouter } from 'next/navigation';



export default function NewSubmissionPage() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:80';
    const [solverModels, setSolverModels] = useState<{ id: string, title: string }[]>([]);
    const [selectedmodel, setSelectedModel] = useState<string | null>(null);
    const [submissionName, setSubmissionName] = useState<string>('');
    const [metadataFiles, setMetadataFiles] = useState<File[]>([]);
    const [inputDataFiles, setInputDataFiles] = useState<File[]>([]);
    const [selectedMetadataFile, setSelectedMetadataFile] = useState<File | null>(null);
    const [selectedInputDataFile, setSelectedInputDataFile] = useState<File | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const router = useRouter();



    useEffect(() => {
        //Fetch solver models from the API
        async function fetchSolverModels() {
          const authData = JSON.parse(localStorage.getItem('authData') || '{}');
          const token = authData.token;

            try{
                //Replace with actual API call
                const response = await fetch(`${apiUrl}/api/solver/all-solver-models`,{
                  method: 'GET', // Explicitly specifying the GET method
                  headers: {
                    'Authorization': `Bearer ${token}`, // Include the token in the headers
                    'Content-Type': 'application/json',
                },
                });
                const data = await response.json();
                // Extract the id and title from the solver models
                const models = data.solverModels.map((model: any) => ({
                    id: model._id,
                    title: model.title,
                }));
                setSolverModels(models);
            } catch (error) {
                console.error("Failed to fetch solver models:", error);
                setMessage("Failed to load solver models.");
            }
        }

        fetchSolverModels();
    }, [apiUrl]);

    const handleSolverModelChange = (event:React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedModel(event.target.value);
    };

    const handleFileUpload = (
        event: React.ChangeEvent<HTMLInputElement>,
        setFiles:React.Dispatch<React.SetStateAction<File[]>>,
        setSelectedFile: React.Dispatch<React.SetStateAction<File | null>>
    ) => {
        const files = Array.from(event.target.files || []);
        setFiles(files);
        setSelectedFile(null); //Clear previous selection
    };

    const handleFileClick = (
        file: File,
        setSelectedFile: React.Dispatch<React.SetStateAction<File | null>>
    ) => {
        setSelectedFile(file);
        setMessage(`${file.name} selected`);
    };
    const uploadFile = async (file: File, fileType: string, solverModelId: string, token: string) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('fileType', fileType);
        formData.append('solverModelId', solverModelId);

        const response = await fetch(`${apiUrl}/api/solver/upload`, {
            method: "POST",
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            },
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`Error uploading ${fileType} file: ${await response.text()}`);
        }
    };

    const handleCreateSubmission = async () => {
        if (!selectedmodel || !selectedMetadataFile || !selectedInputDataFile){
            setMessage("Please select a solver model and both metadata and input files.");
            return;
        }

        try {
          const authData = JSON.parse(localStorage.getItem('authData') || '{}');
          const token = authData.token;
          const submissionData = {
              name: submissionName, // You might want to get this from user input
              totalCost: 100, // This should be dynamic based on your logic
              solverModelId: selectedmodel,
              tasks: [
                  {
                      metadataFileName: selectedMetadataFile.name,
                      inputDataFileName: selectedInputDataFile.name,
                  },
              ],
          };

          const submissionResponse = await fetch(`${apiUrl}/api/submission/`, {
              method: "POST",
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`, 
              },
              body: JSON.stringify(submissionData),
          });

          if (submissionResponse.status === 201) {
              setMessage("Submission created successfully.");
              // Upload Metadata File
              await uploadFile(selectedMetadataFile, 'metadata', selectedmodel, token);
               // Upload Input Data File
               await uploadFile(selectedInputDataFile, 'inputData', selectedmodel, token);

               setMessage("Submission and files uploaded successfully.");

          } else {
              const errorData = await submissionResponse.json();
              setMessage(`Error: ${errorData.message}`);
          }
      } catch (error) {
          console.error("Failed to create submission:", error);
          setMessage("Failed to create submission.");
      }
  };

    const handleCancel = () => {
        // Clear all the selections and files
        setSelectedModel(null);
        setMetadataFiles([]);
        setInputDataFiles([]);
        setSelectedMetadataFile(null);
        setSelectedInputDataFile(null);
        setMessage(null);
    };

    const handleBackToSubmissions = () => {
      router.push('/all-submissions'); // Redirect to the all-submissions page
  };

      return (
        <div className="p-8">
        <div className="mb-8">
            <label htmlFor="submissionName" className="block text-xl font-bold mb-4">
                Submission Name
            </label>
            <input
                type="text"
                id="submissionName"
                value={submissionName}
                onChange={(e) => setSubmissionName(e.target.value)}
                className="w-full p-2 border rounded text-black"
                placeholder="Enter submission name"
            />
        </div>
        <div className="mb-8">
            <label htmlFor="solverModel" className="block text-xl font-bold mb-4">
                Solver Model
            </label>
            <select
                id="solverModel"
                value={selectedmodel || ""}
                onChange={handleSolverModelChange}
                className="w-full p-2 border rounded text-black"
            >
                <option value="" disabled>
                    Select solver model
                </option>
                {solverModels.map((model) => (
                    <option key={model.id} value={model.id} className='text-black'>
                        {model.title}
                    </option>
                ))}
            </select>
        </div>

        {selectedmodel && (
            <>
                <div className="grid grid-cols-2 gap-8 mb-8">
                    <div>
                        <h2 className="text-lg font-bold mb-4">Metadata</h2>
                        <div className="border rounded p-4">
                            <input
                                type="file"
                                multiple
                                onChange={(e) => handleFileUpload(e, setMetadataFiles, setSelectedMetadataFile)}
                                className="mb-4"
                            />
                            {metadataFiles.length > 0 && (
                                <ul>
                                    {metadataFiles.map((file) => (
                                        <li
                                            key={file.name}
                                            className={`p-2 border rounded cursor-pointer text-black mb-2 ${selectedMetadataFile === file ? "bg-gray-300" : "bg-gray-100"}`}
                                            onClick={() => handleFileClick(file, setSelectedMetadataFile)}
                                        >
                                            {file.name}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                    <div>
                        <h2 className="text-lg font-bold mb-4">Input data</h2>
                        <div className="border rounded p-4">
                            <input
                                type="file"
                                multiple
                                onChange={(e) => handleFileUpload(e, setInputDataFiles, setSelectedInputDataFile)}
                                className="mb-4"
                            />
                            {inputDataFiles.length > 0 && (
                                <ul>
                                    {inputDataFiles.map((file) => (
                                        <li
                                            key={file.name}
                                            className={`p-2 border rounded cursor-pointer text-black mb-2 ${selectedInputDataFile === file ? "bg-gray-300" : "bg-gray-100"}`}
                                            onClick={() => handleFileClick(file, setSelectedInputDataFile)}
                                        >
                                            {file.name}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>

                <div className="border rounded p-4 mb-4">
                    <h2 className="text-lg font-bold mb-4">
                        New problem submission for {solverModels.find(model => model.id === selectedmodel)?.title}
                    </h2>
                    <div className="text-gray-700 mb-4">{message}</div>
                    <div className="flex justify-between">
                        <button
                            onClick={handleCreateSubmission}
                            className="bg-[#f5e1c0] py-2 px-4 rounded-lg text-black"
                        >
                            Create
                        </button>
                        <button
                            onClick={handleCancel}
                            className="bg-red-500 text-white py-2 px-4 rounded-lg"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </>
        )}
        {message && (
            <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-300 text-black p-4 rounded-lg shadow-lg flex items-center">
                {message}
                <button
                    onClick={handleBackToSubmissions}
                    className="ml-4 bg-blue-500 text-white py-1 px-3 rounded-lg"
                >
                    Back to Submissions
                </button>
            </div>
        )}
    </div>
      );
}

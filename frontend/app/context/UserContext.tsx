"use client";

import React, { createContext, useState, useContext, ReactNode } from 'react';

// Define the type for the user context
interface UserContextType {
  username: string | null;
  setUsername: (username: string | null) => void;
}
// Create the UserContext with default values
const UserContext = createContext<UserContextType | undefined>(undefined);

// Custom hook to use the UserContext
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

// Provider component to wrap around parts of the app that need access to user state
export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [username, setUsername] = useState<string | null>(null);

  return (
    <UserContext.Provider value={{ username, setUsername }}>
      {children}
    </UserContext.Provider>
  );
};
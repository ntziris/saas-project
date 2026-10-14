"use client";

import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { UserProvider, useUser } from './context/UserContext';
import React, {useState, useEffect} from "react";
import Image from "next/image";
import navLogo from "/public/images/nav.jpg";
import { usePathname } from "next/navigation"; 

const inter = Inter({ subsets: ["latin"] });

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
    <UserProvider>
      <div>
        <NavbarLogo />
        <Navbar />
        <main>{children}</main>
      </div>
    </UserProvider>
    </body>
    </html>
  );
}
const NavbarLogo = () => {
  return(
    <div>
        <Image
          src={navLogo}
          alt="Navbar Image"
          width={1400}
          height={200}
          className="rounded-lg w-[1400px] h-[171px] object-cover"
        />
      </div>
  )
}
const Navbar = () => {
  const { username } = useUser(); // Get username from the context
  const pathname = usePathname();



  return (
    <nav className="flex justify-between items-center p-4 bg-gray-100">
      <div className="flex-1 flex justify-start">
        {username ? (
          <span className="bg-[#f5e1c0] py-2 px-4 rounded-lg text-gray-600 mr-4">
            Welcome, {username}
          </span>
        ) : (
          <div className="bg-[#f5e1c0] py-2 px-4 rounded-lg text-black">
            <Link href="/login">Login</Link>
          </div>
        )}
      </div>
      <div className="flex-1 flex justify-end">
        {pathname === '/all-submissions' ? (
          <div className="bg-[#f5e1c0] py-2 px-4 rounded-lg text-black">
            <Link href="/credits">BUY CREDITS</Link>
          </div>
        ) : (
          <div className="bg-[#f5e1c0] py-2 px-4 rounded-lg text-black">
            <Link href="/all-submissions">Back to Home</Link>
          </div>
        )}
      </div>
    </nav>
  );
};

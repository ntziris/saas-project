import Image from "next/image";
import logo from '/public/images/background.jpg';

export default function Home() {
  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-100">
      
        <h1 className="text-center text-black text-[50px] py-4 m-10">Welcome to our app. Click the Log in button to continue!</h1>
        <Image
          src={logo}
          alt="Company Logo"
          width={600}
          height={600} 
          className="mx-auto mb-6"
        />
       
        </div>
  );
}

"use client";

import Navbar from "@/components/navbar";
import Providers from "@/components/providers";
import { Inter } from "next/font/google";
import "./globals.css";
import Footer from "@/components/footer";
import { ToastContainer, Flip } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';


const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({children}: {children: React.ReactNode;}) {
  return (
    <html lang="en">
      <head>
        <title>ethos wallet</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={inter.className}>
        <Providers>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            {children}
            <div className="grow" />
            <Footer />
            <ToastContainer
              position="bottom-right"
              autoClose={3000}
              newestOnTop={false}
              hideProgressBar={true}
              rtl={false}
              pauseOnFocusLoss
              pauseOnHover
              theme="dark"
              stacked 
              transition={Flip}
            />
          </div>
        </Providers>
      </body>
    </html>
  );
}
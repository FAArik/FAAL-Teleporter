import type {Metadata} from "next";
import localFont from "next/font/local";
import "./globals.css";
import {cookieToInitialState} from 'wagmi'

import {getConfig} from '@/wagmi'
import {Providers} from '@/providers'
import {ReactNode} from "react";
import {headers} from "next/headers";
import {ToastContainer} from "react-toastify";

import 'react-toastify/dist/ReactToastify.css';

const geistSans = localFont({
    src: "./fonts/GeistVF.woff",
    variable: "--font-geist-sans",
    weight: "100 900",
});
const geistMono = localFont({
    src: "./fonts/GeistMonoVF.woff",
    variable: "--font-geist-mono",
    weight: "100 900",
});

export const metadata: Metadata = {
    title: "Teleporter demo",
    description: "Avalanche L1 teleporter demo",
};

export default function RootLayout(props: { children: ReactNode }) {
    const initialState = cookieToInitialState(
        getConfig(),
        headers().get('cookie'),
    )
    return (
        <html lang="en">
        <head>
            <link rel="manifest" href="/manifest.json"/>
            <link rel="apple-touch-icon" href="/icons/icon-192x192.png"/>
            <meta name="theme-color" content="#4CAF50"/>
            <meta name="viewport" content="width=device-width, initial-scale=1"/>
        </head>
        <body
            className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
        <Providers initialState={initialState}>
            <div className="container">
                <div className="row">
                    <ToastContainer/>
                    <div className="col">
                        {props.children}
                    </div>
                </div>
            </div>
        </Providers>
        </body>
        </html>
    );
}

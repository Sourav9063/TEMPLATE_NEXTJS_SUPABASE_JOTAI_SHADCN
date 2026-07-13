"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import errorImage from "@/assets/404.png";
import { Button } from "@/components/ui/button";
import { appRoutes } from "@/constants/app-route";

export default function ErrorBoundary({
  error: errorObject,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(errorObject);
  }, [errorObject]);

  let errorMessage = errorObject.message;
  try {
    const parsed = JSON.parse(errorMessage);
    console.log(parsed);
    if (parsed && typeof parsed === "object") {
      // If payload has a message, use it. Otherwise use statusText or status.
      // Adjust this logic based on what your API returns in 'payload'.
      const payload = parsed.payload;
      if (
        payload &&
        typeof payload === "object" &&
        "message" in payload &&
        typeof payload.message === "string"
      ) {
        errorMessage = payload.message;
      } else if (typeof payload === "string") {
        errorMessage = payload;
      } else if (parsed.statusText) {
        errorMessage = `Error ${parsed.status}: ${parsed.statusText}`;
      }
    }
  } catch {
    // message is not JSON, use as is
  }

  const reloadPage = () => {
    window.location.reload();
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100 dark:bg-gray-900 text-center min-h-screen min-w-screen">
      <Image
        src={errorImage}
        alt="Something went wrong"
        className="mb-8 w-full h-full absolute z-0"
      />
      <div className="z-10 bg-surface-100/20 backdrop-blur-md mb-100 rounded p-10">
        <h1 className="text-4xl font-bold text-gray-800 ">
          Something went wrong
        </h1>
        <p className="mt-4 text-lg text-gray-600 ">
          {errorMessage || "An unexpected error occurred. Please try again."}
        </p>
        {errorObject.digest && (
          <p className="mt-2 text-xs text-gray-500">
            Error ID: {errorObject.digest}
          </p>
        )}
        <div className="flex gap-2 justify-center items-center pt-2">
          <Button type="button" onClick={reloadPage}>
            Reload
          </Button>
          <Button>
            <Link href={appRoutes.LOGIN}>Login</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

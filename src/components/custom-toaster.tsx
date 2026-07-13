"use client";

import { Toaster } from "@/components/ui/sonner";

export function CustomToaster() {
  return (
    <>
      <style>{`
        [data-sonner-toast][data-type=error][data-styled=true] {
          background: rgb(254 242 242) !important;
          color: rgb(220 38 38) !important;
          border-color: rgb(254 202 202) !important;
        }
      `}</style>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            padding: "8px 12px",
          },
        }}
      />
    </>
  );
}

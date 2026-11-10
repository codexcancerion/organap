import React from "react";

export default function PublicAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] px-4 py-8">
      {children}
    </div>
  );
}

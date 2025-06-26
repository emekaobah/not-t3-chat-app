"use client";

import React, { type ErrorInfo } from "react";
import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

function ErrorFallback({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) {
  return (
    <div className="flex items-center justify-center min-h-[200px] p-6">
      <div className="text-center space-y-4 max-w-md">
        <div className="flex justify-center">
          <AlertCircle className="h-12 w-12 text-red-500" />
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">
            Something went wrong
          </h2>
          <p className="text-sm text-muted-foreground">
            {error.message ||
              "An unexpected error occurred while loading data."}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Button
            onClick={resetErrorBoundary}
            variant="default"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>

          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            size="sm"
          >
            Reload Page
          </Button>
        </div>

        <details className="text-left">
          <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
            Technical Details
          </summary>
          <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-x-auto">
            {error.stack}
          </pre>
        </details>
      </div>
    </div>
  );
}

export function QueryErrorBoundary({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          FallbackComponent={ErrorFallback}
          onReset={reset}
          onError={(error: Error, errorInfo: ErrorInfo) => {
            // Log error for monitoring
            console.error(
              "QueryErrorBoundary caught an error:",
              error,
              errorInfo
            );
          }}
        >
          {children}
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}

// Specialized error boundary for specific features
export function ConversationErrorBoundary({
  children,
}: {
  children: React.ReactNode;
}) {
  return <QueryErrorBoundary>{children}</QueryErrorBoundary>;
}

export function ModelErrorBoundary({
  children,
}: {
  children: React.ReactNode;
}) {
  return <QueryErrorBoundary>{children}</QueryErrorBoundary>;
}

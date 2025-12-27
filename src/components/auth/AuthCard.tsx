import { ReactNode } from "react";

interface AuthCardProps {
  headerContent: ReactNode;
  children: ReactNode;
}

export function AuthCard({ headerContent, children }: AuthCardProps) {
  return (
    <div className="bg-card text-card-foreground rounded-lg border shadow-sm">
      <div className="p-6 space-y-2">
        {headerContent}
      </div>
      <div className="p-6 pt-0">
        {children}
      </div>
    </div>
  );
} 
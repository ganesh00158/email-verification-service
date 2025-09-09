import { useState } from "react";
import { AuthWrapper } from "@/components/AuthWrapper";
import { EmailUpload } from "@/components/EmailUpload";
import { EmailResults } from "@/components/EmailResults";

const Index = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleUploadComplete = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <AuthWrapper>
      <div className="space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Email Verification Service
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Upload emails for comprehensive validation including syntax checks, domain verification, and MX record validation.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <EmailUpload onUploadComplete={handleUploadComplete} />
          </div>
          <div className="lg:col-span-2">
            <EmailResults refreshTrigger={refreshTrigger} />
          </div>
        </div>
      </div>
    </AuthWrapper>
  );
};

export default Index;

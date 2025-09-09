import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Mail, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface EmailUploadProps {
  onUploadComplete: () => void;
}

export function EmailUpload({ onUploadComplete }: EmailUploadProps) {
  const [emails, setEmails] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const { toast } = useToast();

  const parseEmails = (text: string): string[] => {
    // Split by common delimiters and filter out empty strings
    return text
      .split(/[\n,;|\s]+/)
      .map(email => email.trim())
      .filter(email => email.length > 0 && email.includes('@'));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setEmails(content);
    };
    reader.readAsText(selectedFile);
  };

  const handleSubmit = async () => {
    if (!emails.trim()) {
      toast({
        title: "No emails provided",
        description: "Please enter or upload some emails to verify",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    
    try {
      const emailList = parseEmails(emails);
      
      if (emailList.length === 0) {
        toast({
          title: "No valid emails found",
          description: "Please check your email format",
          variant: "destructive",
        });
        setIsUploading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('verify-emails', {
        body: { emails: emailList }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Upload successful!",
        description: `Started verification for ${emailList.length} emails`,
      });

      setEmails("");
      setFile(null);
      onUploadComplete();
      
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload emails",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Upload Emails for Verification
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="file-upload" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Upload from File (CSV/TXT)
          </Label>
          <Input
            id="file-upload"
            type="file"
            accept=".csv,.txt"
            onChange={handleFileUpload}
            className="cursor-pointer"
          />
          {file && (
            <p className="text-sm text-muted-foreground">
              Selected: {file.name}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="emails">Or Paste Emails (one per line, comma or space separated)</Label>
          <Textarea
            id="emails"
            placeholder="john@example.com&#10;jane@company.org&#10;user@domain.net"
            value={emails}
            onChange={(e) => setEmails(e.target.value)}
            className="min-h-[150px] font-mono text-sm"
          />
        </div>

        <Button 
          onClick={handleSubmit} 
          disabled={isUploading || !emails.trim()}
          className="w-full"
        >
          <Upload className="h-4 w-4 mr-2" />
          {isUploading ? "Verifying Emails..." : "Start Verification"}
        </Button>

        <div className="text-sm text-muted-foreground">
          <p><strong>Supported formats:</strong> CSV, TXT files or direct text input</p>
          <p><strong>Verification includes:</strong> Syntax validation, domain existence, MX records</p>
        </div>
      </CardContent>
    </Card>
  );
}
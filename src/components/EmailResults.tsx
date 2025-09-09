import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, RefreshCw, CheckCircle, XCircle, AlertTriangle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface EmailResult {
  id: string;
  email: string;
  status: 'PENDING' | 'VALID' | 'INVALID' | 'DISPOSABLE' | 'UNKNOWN';
  reason: string;
  syntax_valid: boolean | null;
  domain_exists: boolean | null;
  mx_records_exist: boolean | null;
  created_at: string;
  verified_at: string | null;
}

interface EmailResultsProps {
  refreshTrigger?: number;
}

export function EmailResults({ refreshTrigger }: EmailResultsProps) {
  const [results, setResults] = useState<EmailResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { toast } = useToast();

  const fetchResults = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('get-email-results', {
        body: { status: statusFilter === 'all' ? null : statusFilter }
      });

      if (error) throw error;

      setResults(data.emails || []);
    } catch (error) {
      console.error('Fetch results error:', error);
      toast({
        title: "Failed to fetch results",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadResults = async (format: 'json' | 'csv') => {
    try {
      const response = await fetch(`https://lzuzyjwhwliutqlvgymh.supabase.co/functions/v1/get-email-results?format=${format}&status=${statusFilter === 'all' ? '' : statusFilter}`, {
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `email_results.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Download started",
        description: `Email results downloaded as ${format.toUpperCase()}`,
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchResults();
  }, [refreshTrigger, statusFilter]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'VALID':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'INVALID':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'DISPOSABLE':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'PENDING':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'VALID':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'INVALID':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'DISPOSABLE':
        return 'bg-orange-100 text-orange-800 hover:bg-orange-200';
      case 'PENDING':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const statusCounts = results.reduce((acc, result) => {
    acc[result.status] = (acc[result.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{results.length}</div>
            <div className="text-sm text-muted-foreground">Total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{statusCounts.VALID || 0}</div>
            <div className="text-sm text-muted-foreground">Valid</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{statusCounts.INVALID || 0}</div>
            <div className="text-sm text-muted-foreground">Invalid</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{statusCounts.DISPOSABLE || 0}</div>
            <div className="text-sm text-muted-foreground">Disposable</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{statusCounts.PENDING || 0}</div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </CardContent>
        </Card>
      </div>

      {/* Results Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Email Verification Results</CardTitle>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="VALID">Valid Only</SelectItem>
                  <SelectItem value="INVALID">Invalid Only</SelectItem>
                  <SelectItem value="DISPOSABLE">Disposable Only</SelectItem>
                  <SelectItem value="PENDING">Pending Only</SelectItem>
                </SelectContent>
              </Select>
              
              <Button onClick={fetchResults} disabled={loading} variant="outline" size="sm">
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              
              <Button onClick={() => downloadResults('csv')} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1" />
                CSV
              </Button>
              
              <Button onClick={() => downloadResults('json')} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1" />
                JSON
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading results...</div>
          ) : results.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No email verification results found. Upload some emails to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Checks</TableHead>
                  <TableHead>Verified</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((result) => (
                  <TableRow key={result.id}>
                    <TableCell className="font-mono text-sm">{result.email}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(result.status)}>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(result.status)}
                          {result.status}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{result.reason}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Badge variant={result.syntax_valid ? "default" : "destructive"} className="text-xs">
                          Syntax: {result.syntax_valid ? '✓' : '✗'}
                        </Badge>
                        <Badge variant={result.domain_exists ? "default" : "destructive"} className="text-xs">
                          Domain: {result.domain_exists ? '✓' : '✗'}
                        </Badge>
                        <Badge variant={result.mx_records_exist ? "default" : "destructive"} className="text-xs">
                          MX: {result.mx_records_exist ? '✓' : '✗'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {result.verified_at ? new Date(result.verified_at).toLocaleDateString() : 'Not verified'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import RoleBasedComponent from '@/components/RoleBasedComponent';
import { UserRole } from '@/types';
import { format } from 'date-fns';
import { FileText, RefreshCw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface AuditLog {
  id: string;
  timestamp: string;
  user_email: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  details: Record<string, any> | null;
}

const fetchAuditLogs = async (): Promise<AuditLog[]> => {
  console.log("Fetching audit logs from Supabase..."); // Added for debugging
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(100); 

  if (error) {
    console.error("Error fetching audit logs:", error);
    throw new Error(error.message);
  }
  console.log("Audit logs fetched:", data.length); // Added for debugging
  return data as AuditLog[];
};

const AdminAuditLogPage = () => {
  const { data: logs, isLoading, error, refetch, isFetching } = useQuery<AuditLog[], Error>({ // Added isFetching
    queryKey: ['auditLogs'],
    queryFn: fetchAuditLogs,
    // Consider adding staleTime and cacheTime if refresh issues persist, though refetch() should bypass these.
    // staleTime: 1000 * 60, // 1 minute
    // cacheTime: 1000 * 60 * 5, // 5 minutes
  });

  const [logDetailsToShow, setLogDetailsToShow] = useState<AuditLog | null>(null); // Changed state for dialog

  const handleRefresh = () => {
    console.log("Refresh button clicked. Calling refetch..."); // Added for debugging
    refetch();
  }

  return (
    <RoleBasedComponent requiredRole={UserRole.Admin} fallback={<div className="text-center py-10">You do not have permission to view this page.</div>}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5 text-primary" />
                Audit Logs
              </CardTitle>
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading || isFetching}> {/* Used isLoading || isFetching */}
                <RefreshCw className={`mr-2 h-4 w-4 ${(isLoading || isFetching) ? 'animate-spin' : ''}`} /> {/* Used isLoading || isFetching */}
                Refresh
              </Button>
            </div>
            <CardDescription>View a trail of important system events and actions.</CardDescription>
          </CardHeader>
          <CardContent>
            {(isLoading || (isFetching && (!logs || logs.length === 0))) && ( // Show skeleton if loading or fetching initially
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            )}
            {error && <p className="text-red-500">Failed to load audit logs: {error.message}</p>}
            {logs && logs.length === 0 && !isLoading && !isFetching && <p>No audit logs found.</p>}
            {logs && logs.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Resource Type</TableHead>
                    <TableHead>Resource ID</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{format(new Date(log.timestamp), 'PPpp')}</TableCell>
                      <TableCell>{log.user_email || 'N/A'}</TableCell>
                      <TableCell>{log.action}</TableCell>
                      <TableCell>{log.resource_type}</TableCell>
                      <TableCell>{log.resource_id || 'N/A'}</TableCell>
                      <TableCell>
                        {log.details && (
                          <Dialog 
                            open={logDetailsToShow?.id === log.id} 
                            onOpenChange={(open) => {
                              if (open) {
                                setLogDetailsToShow(log);
                              } else {
                                // Check if the currently shown dialog is this one before closing
                                if (logDetailsToShow?.id === log.id) {
                                  setLogDetailsToShow(null);
                                }
                              }
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" onClick={() => setLogDetailsToShow(log)}>View</Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[600px]">
                              <DialogHeader>
                                <DialogTitle>Log Details</DialogTitle>
                              </DialogHeader>
                              {logDetailsToShow?.id === log.id && logDetailsToShow.details && (
                                <pre className="mt-2 w-full rounded-md bg-slate-950 p-4 overflow-x-auto">
                                  <code className="text-white">{JSON.stringify(logDetailsToShow.details, null, 2)}</code>
                                </pre>
                              )}
                            </DialogContent>
                          </Dialog>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </RoleBasedComponent>
  );
};

export default AdminAuditLogPage;


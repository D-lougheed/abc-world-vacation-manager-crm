
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import RoleBasedComponent from "@/components/RoleBasedComponent";
import { UserRole } from "@/types";
import { ArrowLeft, UploadCloud } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';
import { addAuditLog } from '@/services/AuditLogService';

type ClientInsertRecord = Database['public']['Tables']['clients']['Insert'];

interface ClientCsvRow {
  firstName?: string;
  lastName?: string;
  [key: string]: any; 
}

const ClientImportPage = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const { user: currentUser } = useAuth();

  const requiredHeaders = ['firstName', 'lastName'];

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
      setImportedCount(0);
      setErrorCount(0);
      setErrors([]);
    }
  };

  const validateRow = (row: ClientCsvRow, rowIndex: number): ClientInsertRecord | null => {
    // Accessing row.firstName (etc.) will now use the trimmed header names as keys
    // if transformHeader is applied during parsing.
    const { firstName, lastName } = row;
    if (!firstName || typeof firstName !== 'string' || firstName.trim() === '') {
      setErrors(prev => [...prev, `Row ${rowIndex + 1}: firstName is required and must be a non-empty string.`]);
      return null;
    }
    if (!lastName || typeof lastName !== 'string' || lastName.trim() === '') {
      setErrors(prev => [...prev, `Row ${rowIndex + 1}: lastName is required and must be a non-empty string.`]);
      return null;
    }
    // Map to database schema (snake_case)
    return { 
      first_name: firstName.trim(), // Value trimming is still good
      last_name: lastName.trim()  // Value trimming is still good
      // If importing notes, add: notes: row.notes ? row.notes.trim() : undefined 
    };
  };

  const handleImport = async () => {
    if (!file) {
      toast({ title: "No file selected", description: "Please select a CSV file to import.", variant: "destructive" });
      return;
    }

    setIsImporting(true);
    setImportedCount(0);
    setErrorCount(0);
    setErrors([]);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: header => header.trim(),
      complete: async (results) => {
        const parsedData = results.data as ClientCsvRow[];
        const fileHeaders = results.meta.fields;

        if (!fileHeaders || !requiredHeaders.every(header => fileHeaders.includes(header))) {
          const errorMsg = `CSV must contain the following headers: ${requiredHeaders.join(', ')}. Found: ${fileHeaders?.join(', ')}`;
          toast({
            title: "Invalid CSV Headers",
            description: errorMsg,
            variant: "destructive",
          });
          setIsImporting(false);
          if (currentUser && file) { // file check added for safety
            await addAuditLog(currentUser, {
              action: 'IMPORT_CLIENTS_FAILED',
              resourceType: 'Client',
              details: { fileName: file.name, reason: 'Invalid headers', error: errorMsg },
            });
          }
          return;
        }

        const validClients: ClientInsertRecord[] = [];
        let currentErrorCount = 0;

        for (let i = 0; i < parsedData.length; i++) {
          const row = parsedData[i];
          const clientData = validateRow(row, i);
          if (clientData) {
            validClients.push(clientData);
          } else {
            currentErrorCount++;
          }
        }
        
        setErrorCount(currentErrorCount);

        if (validClients.length > 0) {
          const { error: dbError } = await supabase.from('clients').insert(validClients); 
          if (dbError) {
            const errorMsg = `Failed to import clients: ${dbError.message}`;
            toast({ title: "Import Error", description: errorMsg, variant: "destructive" });
            setErrors(prev => [...prev, `Database error: ${dbError.message}`]);
            setErrorCount(prev => prev + validClients.length);
            if (currentUser && file) { // file check added for safety
              await addAuditLog(currentUser, {
                action: 'IMPORT_CLIENTS_DB_ERROR',
                resourceType: 'Client',
                details: { fileName: file.name, error: dbError.message, attemptedCount: validClients.length },
              });
            }
          } else {
            setImportedCount(validClients.length);
            toast({ title: "Import Successful", description: `${validClients.length} clients imported successfully.` });
            if (currentUser && file) { // file check added for safety
              await addAuditLog(currentUser, {
                action: 'IMPORT_CLIENTS_SUCCESS',
                resourceType: 'Client',
                details: { fileName: file.name, importedCount: validClients.length, errorCount: currentErrorCount },
              });
            }
          }
        } else if (currentErrorCount > 0) {
             toast({ title: "Import Failed", description: "No valid client data found in the CSV.", variant: "destructive" });
             if (currentUser && file) { // file check added for safety
                await addAuditLog(currentUser, {
                  action: 'IMPORT_CLIENTS_NO_VALID_DATA',
                  resourceType: 'Client',
                  details: { fileName: file.name, errorCount: currentErrorCount },
                });
              }
        } else {
            toast({ title: "Empty CSV", description: "The CSV file is empty or contains no valid data.", variant: "default" });
            if (currentUser && file) { // file check added for safety
                await addAuditLog(currentUser, {
                  action: 'IMPORT_CLIENTS_EMPTY_CSV',
                  resourceType: 'Client',
                  details: { fileName: file.name },
                });
              }
        }
        setIsImporting(false);
      },
      error: async (error) => { // Made this callback async
        const errorMsg = `Error parsing CSV: ${error.message}`;
        toast({ title: "Parsing Error", description: errorMsg, variant: "destructive" });
        setErrors(prev => [...prev, `CSV Parsing error: ${error.message}`]);
        setIsImporting(false);
        if (currentUser && file) { // file check added for safety
          await addAuditLog(currentUser, {
            action: 'IMPORT_CLIENTS_PARSE_ERROR',
            resourceType: 'Client',
            details: { fileName: file.name, error: error.message },
          });
        }
      }
    });
  };

  return (
    <RoleBasedComponent requiredRole={UserRole.Admin} fallback={<div className="text-center py-10">You do not have permission to view this page.</div>}>
      <div className="space-y-6">
        <Button variant="outline" onClick={() => navigate('/admin/import')} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Mass Import Overview
        </Button>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <UploadCloud className="mr-2 h-5 w-5 text-primary" /> Import Clients
            </CardTitle>
            <CardDescription>
              Upload a CSV file to bulk import clients. The CSV file must include headers: <code>{requiredHeaders.join(", ")}</code>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input type="file" accept=".csv" onChange={handleFileChange} disabled={isImporting} />
            {file && <p className="text-sm text-muted-foreground">Selected file: {file.name}</p>}
          </CardContent>
          <CardFooter className="flex flex-col items-start gap-4">
            <Button onClick={handleImport} disabled={isImporting || !file}>
              {isImporting ? 'Importing...' : 'Import Clients'}
            </Button>
            {isImporting && <p>Processing... please wait.</p>}
            {!isImporting && (importedCount > 0 || errorCount > 0) && (
              <div className="text-sm">
                <p className="text-green-600">Successfully imported: {importedCount} clients.</p>
                <p className="text-red-600">Failed rows: {errorCount}.</p>
                {errors.length > 0 && (
                  <div>
                    <h4 className="font-semibold mt-2">Error Details:</h4>
                    <ul className="list-disc list-inside max-h-40 overflow-y-auto">
                      {errors.slice(0, 10).map((err, idx) => <li key={idx} className="text-xs">{err}</li>)}
                      {errors.length > 10 && <li>...and {errors.length - 10} more errors.</li>}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardFooter>
        </Card>
      </div>
    </RoleBasedComponent>
  );
};

export default ClientImportPage;

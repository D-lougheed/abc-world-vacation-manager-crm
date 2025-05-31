
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Upload, File, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import Papa from 'papaparse';
import { useToast } from '@/components/ui/use-toast';

interface CsvImportProps {
  title: string;
  description: string;
  requiredFields: string[];
  onImport: (data: any[]) => Promise<{ success: number; errors: any[] }>;
  sampleData?: any[];
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

interface ParsedData {
  valid: any[];
  errors: ValidationError[];
}

const CsvImport = ({ title, description, requiredFields, onImport, sampleData }: CsvImportProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [importResult, setImportResult] = useState<{ success: number; errors: any[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        toast({
          title: "Invalid file type",
          description: "Please select a CSV file",
          variant: "destructive"
        });
        return;
      }
      setFile(selectedFile);
      setParsedData(null);
      setImportResult(null);
    }
  };

  const validateRow = (row: any, index: number): ValidationError[] => {
    const errors: ValidationError[] = [];

    // Check required fields
    requiredFields.forEach(field => {
      if (!row[field] || row[field].toString().trim() === '') {
        errors.push({
          row: index + 2, // +2 because index is 0-based and we have header row
          field,
          message: `${field} is required`
        });
      }
    });

    return errors;
  };

  const parseFile = () => {
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as any[];
        const errors: ValidationError[] = [];
        const validRows: any[] = [];

        // Check if all required fields are present in headers
        const headers = Object.keys(data[0] || {});
        const missingHeaders = requiredFields.filter(field => !headers.includes(field));
        
        if (missingHeaders.length > 0) {
          toast({
            title: "Missing required columns",
            description: `The following required columns are missing: ${missingHeaders.join(', ')}`,
            variant: "destructive"
          });
          setIsUploading(false);
          return;
        }

        // Validate each row
        data.forEach((row, index) => {
          const rowErrors = validateRow(row, index);
          if (rowErrors.length > 0) {
            errors.push(...rowErrors);
          } else {
            // Clean the data
            const cleanRow: any = {};
            requiredFields.forEach(field => {
              cleanRow[field] = row[field]?.toString().trim() || null;
            });
            validRows.push(cleanRow);
          }
        });

        setParsedData({ valid: validRows, errors });
        setUploadProgress(100);
        setIsUploading(false);

        toast({
          title: "File parsed successfully",
          description: `Found ${validRows.length} valid rows and ${errors.length} errors`
        });
      },
      error: (error) => {
        toast({
          title: "Parse error",
          description: `Failed to parse CSV: ${error.message}`,
          variant: "destructive"
        });
        setIsUploading(false);
      }
    });
  };

  const handleImport = async () => {
    if (!parsedData || parsedData.valid.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const result = await onImport(parsedData.valid);
      setImportResult(result);
      
      toast({
        title: "Import completed",
        description: `Successfully imported ${result.success} records`
      });
    } catch (error: any) {
      toast({
        title: "Import failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(100);
    }
  };

  const downloadSample = () => {
    if (!sampleData) return;

    const csv = Papa.unparse(sampleData, {
      header: true
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, '_')}_sample.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Required CSV columns: <code className="bg-muted px-1 rounded">{requiredFields.join(', ')}</code>
            </p>
            {sampleData && (
              <Button variant="outline" size="sm" onClick={downloadSample}>
                <File className="mr-2 h-4 w-4" />
                Download Sample CSV
              </Button>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <Input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="flex-1"
              />
              <Button onClick={parseFile} disabled={!file || isUploading}>
                <Upload className="mr-2 h-4 w-4" />
                Parse File
              </Button>
            </div>

            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Processing...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {parsedData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Validation Results
              <div className="flex space-x-2">
                <Badge variant="default" className="bg-green-500">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  {parsedData.valid.length} Valid
                </Badge>
                {parsedData.errors.length > 0 && (
                  <Badge variant="destructive">
                    <XCircle className="mr-1 h-3 w-3" />
                    {parsedData.errors.length} Errors
                  </Badge>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {parsedData.errors.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="font-medium">Found {parsedData.errors.length} validation errors:</p>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {parsedData.errors.slice(0, 10).map((error, index) => (
                        <p key={index} className="text-xs">
                          Row {error.row}: {error.message}
                        </p>
                      ))}
                      {parsedData.errors.length > 10 && (
                        <p className="text-xs text-muted-foreground">
                          ...and {parsedData.errors.length - 10} more errors
                        </p>
                      )}
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {parsedData.valid.length > 0 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Preview of valid data ({parsedData.valid.length} rows):</h4>
                  <div className="border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto max-h-64">
                      <table className="w-full text-sm">
                        <thead className="bg-muted">
                          <tr>
                            {requiredFields.map(field => (
                              <th key={field} className="px-3 py-2 text-left font-medium">
                                {field}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {parsedData.valid.slice(0, 5).map((row, index) => (
                            <tr key={index} className="border-t">
                              {requiredFields.map(field => (
                                <td key={field} className="px-3 py-2">
                                  {row[field]}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {parsedData.valid.length > 5 && (
                      <div className="px-3 py-2 bg-muted text-xs text-muted-foreground">
                        Showing first 5 of {parsedData.valid.length} valid rows
                      </div>
                    )}
                  </div>
                </div>
                
                <Button 
                  onClick={handleImport} 
                  disabled={isUploading}
                  className="w-full"
                >
                  Import {parsedData.valid.length} Records
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {importResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
              Import Complete
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p>Successfully imported <strong>{importResult.success}</strong> records.</p>
              {importResult.errors.length > 0 && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    {importResult.errors.length} records failed to import:
                  </p>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {importResult.errors.slice(0, 5).map((error, index) => (
                      <p key={index} className="text-xs text-red-600">
                        {error.message || JSON.stringify(error)}
                      </p>
                    ))}
                    {importResult.errors.length > 5 && (
                      <p className="text-xs text-muted-foreground">
                        ...and {importResult.errors.length - 5} more errors
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CsvImport;

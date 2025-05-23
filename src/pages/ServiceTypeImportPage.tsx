
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import RoleBasedComponent from "@/components/RoleBasedComponent";
import { UserRole } from "@/types";
import { ArrowLeft, UploadCloud } from 'lucide-react';

const ServiceTypeImportPage = () => {
  const navigate = useNavigate();
  const requiredFields = ["name"];

  return (
    <RoleBasedComponent requiredRole={UserRole.Admin} fallback={<div className="text-center py-10">You do not have permission to view this page.</div>}>
      <div className="space-y-6">
        <Button variant="outline" onClick={() => navigate('/admin/import')} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Mass Import Overview
        </Button>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <UploadCloud className="mr-2 h-5 w-5 text-primary" /> Import Service Types
            </CardTitle>
            <CardDescription>
              Upload a CSV file to bulk import service types. Required CSV Headers: <code>{requiredFields.join(", ")}</code>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Service Type import functionality is under development. Please check back later.</p>
          </CardContent>
        </Card>
      </div>
    </RoleBasedComponent>
  );
};

export default ServiceTypeImportPage;

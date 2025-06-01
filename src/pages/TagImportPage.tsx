
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import RoleBasedComponent from "@/components/RoleBasedComponent";
import { UserRole } from "@/types";
import CsvImport from '@/components/CsvImport';
import { useTagImport } from '@/hooks/useTagImport';

const TagImportPage = () => {
  const navigate = useNavigate();
  const { importTags } = useTagImport();
  
  const requiredFields = ["name"];

  const sampleData = [
    { name: "Adventure" },
    { name: "Luxury" },
    { name: "Budget-Friendly" },
    { name: "Family-Friendly" },
    { name: "Romance" },
    { name: "Business Travel" },
    { name: "Solo Travel" },
    { name: "Group Travel" },
    { name: "Cultural" },
    { name: "Nature" }
  ];

  return (
    <RoleBasedComponent 
      requiredRole={UserRole.Admin} 
      fallback={<div className="text-center py-10">You do not have permission to view this page.</div>}
    >
      <div className="space-y-6">
        <Button variant="outline" onClick={() => navigate('/admin/import')} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Mass Import Overview
        </Button>
        
        <CsvImport
          title="Import Tags"
          description="Upload a CSV file to bulk import tags. Each tag will be created with the specified name and can be used to categorize bookings, trips, vendors, and service types."
          requiredFields={requiredFields}
          onImport={importTags}
          sampleData={sampleData}
        />
      </div>
    </RoleBasedComponent>
  );
};

export default TagImportPage;

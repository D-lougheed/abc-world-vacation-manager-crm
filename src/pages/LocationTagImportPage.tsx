
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import RoleBasedComponent from "@/components/RoleBasedComponent";
import { UserRole } from "@/types";
import CsvImport from '@/components/CsvImport';
import { useLocationTagImport } from '@/hooks/useLocationTagImport';

const LocationTagImportPage = () => {
  const navigate = useNavigate();
  const { importLocationTags } = useLocationTagImport();
  
  const requiredFields = ["continent", "country", "state_province", "city"];

  const sampleData = [
    {
      continent: "North America",
      country: "United States", 
      state_province: "California",
      city: "Los Angeles"
    },
    {
      continent: "North America",
      country: "United States",
      state_province: "California", 
      city: "San Francisco"
    },
    {
      continent: "Europe",
      country: "France",
      state_province: "Île-de-France",
      city: "Paris"
    },
    {
      continent: "Asia",
      country: "Japan",
      state_province: "Tokyo",
      city: "Tokyo"
    },
    {
      continent: "Europe",
      country: "United Kingdom",
      state_province: "England",
      city: "London"
    }
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
          title="Import Location Tags"
          description="Upload a CSV file to bulk import location tags. All fields are required and will create hierarchical location tags with continent, country, state/province, and city."
          requiredFields={requiredFields}
          onImport={importLocationTags}
          sampleData={sampleData}
        />
      </div>
    </RoleBasedComponent>
  );
};

export default LocationTagImportPage;


import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import RoleBasedComponent from "@/components/RoleBasedComponent";
import { UserRole } from "@/types";
import CsvImport from '@/components/CsvImport';
import { useVendorImport } from '@/hooks/useVendorImport';

const VendorImportPage = () => {
  const navigate = useNavigate();
  const { importVendors } = useVendorImport();
  
  const requiredFields = [
    "name", 
    "contactPerson", 
    "email", 
    "phone", 
    "address", 
    "serviceArea", 
    "priceRange", 
    "commissionRate"
  ];

  const sampleData = [
    { 
      name: "Adventure Tours Inc",
      contactPerson: "John Smith",
      email: "john@adventuretours.com",
      phone: "+1 (555) 123-4567",
      address: "123 Adventure Ave, Denver, CO",
      serviceArea: "Regional",
      priceRange: "3",
      commissionRate: "0.15",
      serviceTypes: "Tours, Adventure Activities",
      tags: "Adventure, Outdoor",
      notes: "Specializes in mountain adventures"
    },
    { 
      name: "Luxury Stays Hotel",
      contactPerson: "Sarah Johnson",
      email: "sarah@luxurystays.com",
      phone: "+1 (555) 987-6543",
      address: "456 Luxury Blvd, Miami, FL",
      serviceArea: "Local",
      priceRange: "5",
      commissionRate: "0.12",
      serviceTypes: "Accommodation",
      tags: "Luxury, Business Travel",
      notes: "Premium beachfront accommodations"
    },
    { 
      name: "Budget Car Rentals",
      contactPerson: "Mike Davis",
      email: "mike@budgetcars.com",
      phone: "+1 (555) 456-7890",
      address: "789 Budget St, Phoenix, AZ",
      serviceArea: "National",
      priceRange: "2",
      commissionRate: "0.08",
      serviceTypes: "Transportation",
      tags: "Budget-Friendly, Family-Friendly",
      notes: "Affordable car rental options"
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
          title="Import Vendors"
          description="Upload a CSV file to bulk import vendors. Each vendor will be created with the specified details. Service types and tags should be comma-separated (e.g., 'Tours, Transportation' or 'Adventure, Luxury'). Price range should be 1-5, commission rate should be decimal (e.g., 0.15 for 15%)."
          requiredFields={requiredFields}
          onImport={importVendors}
          sampleData={sampleData}
        />
        
        <div className="mt-4 p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">Additional CSV Columns (Optional):</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li><code>serviceTypes</code> - Comma-separated service type names (must exist in system)</li>
            <li><code>tags</code> - Comma-separated tag names (must exist in system)</li>
            <li><code>notes</code> - Additional notes about the vendor</li>
          </ul>
          <p className="text-sm text-muted-foreground mt-2">
            <strong>Note:</strong> All referenced service types and tags must exist in the system before import. 
            Create them first via their respective import pages if needed.
          </p>
        </div>
      </div>
    </RoleBasedComponent>
  );
};

export default VendorImportPage;

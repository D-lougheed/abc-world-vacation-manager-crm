
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Briefcase,
  Edit,
  CalendarCheck,
  Save,
  Trash2,
  Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UserRole } from "@/types";
import RoleBasedComponent from "@/components/RoleBasedComponent";
import { useToast } from "@/components/ui/use-toast";

// Import refactored components
import VendorForm from "@/components/vendors/VendorForm";
import VendorInfo from "@/components/vendors/VendorInfo";
import BookingHistory from "@/components/vendors/BookingHistory"; 
import DocumentsList from "@/components/vendors/DocumentsList";
import ServiceTypeCommissions from "@/components/vendors/ServiceTypeCommissions";

// Import custom hooks
import { useVendorData } from "@/hooks/vendors/useVendorData";
import { useVendorActions } from "@/hooks/vendors/useVendorActions";

const VendorDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const isNewVendor = id === "new";
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isEditMode, setIsEditMode] = useState(isNewVendor);
  
  // Use custom hooks to manage vendor data and actions
  const {
    loading,
    formData,
    setFormData,
    serviceTypes,
    setServiceTypes,
    tags,
    setTags,
    bookings,
    documents,
    vendorRating,
    serviceTypeCommissions,
    setServiceTypeCommissions
  } = useVendorData(id, isNewVendor);
  
  const {
    saving,
    deleteDialogOpen,
    setDeleteDialogOpen,
    handleSaveVendor,
    handleDeleteVendor
  } = useVendorActions(id, isNewVendor, formData, serviceTypes, tags);
  
  // Handler to save vendor and exit edit mode
  const handleSaveAndExitEditMode = async () => {
    await handleSaveVendor(serviceTypeCommissions);
    if (!isNewVendor) {
      setIsEditMode(false);
    }
  };

  // Render the vendor's rating if available
  const renderRating = () => {
    if (!vendorRating || vendorRating === 0) return null;
    
    return (
      <div className="flex items-center gap-1 text-sm">
        <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
        <span>{vendorRating?.toFixed(1)}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading vendor data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-primary/10 p-3">
            <Briefcase className="h-6 w-6 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">{isNewVendor ? "New Vendor" : formData.name}</h1>
              {renderRating()}
            </div>
            <p className="text-sm text-muted-foreground">
              {isNewVendor ? "Create a new vendor" : `Contact: ${formData.contactPerson}`}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          {isEditMode ? (
            <Button onClick={handleSaveAndExitEditMode} disabled={saving}>
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {isNewVendor ? "Create Vendor" : "Save Changes"}
                </>
              )}
            </Button>
          ) : (
            <RoleBasedComponent requiredRole={UserRole.Admin}>
              <Button onClick={() => setIsEditMode(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Vendor
              </Button>
            </RoleBasedComponent>
          )}
          
          {!isNewVendor && !isEditMode && (
            <Button variant="outline">
              <CalendarCheck className="mr-2 h-4 w-4" />
              Create Booking
            </Button>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Vendor information */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>{isEditMode ? (isNewVendor ? "Vendor Information" : "Edit Vendor Information") : "Vendor Details"}</CardTitle>
            {isNewVendor && <CardDescription>Add details about this vendor</CardDescription>}
          </CardHeader>
          <CardContent>
            {isEditMode ? (
              <VendorForm
                isNewVendor={isNewVendor}
                vendorId={id}
                formData={formData}
                setFormData={setFormData}
                serviceTypes={serviceTypes}
                setServiceTypes={setServiceTypes}
                tags={tags}
                setTags={setTags}
                onSave={handleSaveAndExitEditMode}
                saving={saving}
              />
            ) : (
              <VendorInfo
                name={formData.name}
                contactPerson={formData.contactPerson}
                email={formData.email}
                phone={formData.phone}
                address={formData.address}
                serviceArea={formData.serviceArea}
                commissionRate={formData.commissionRate}
                priceRange={formData.priceRange}
                serviceTypes={serviceTypes}
                tags={tags}
                notes={formData.notes}
                rating={vendorRating}
              />
            )}
          </CardContent>
          <CardFooter className="justify-between">
            {isEditMode ? (
              isNewVendor ? (
                <p className="text-sm text-muted-foreground">* Required fields</p>
              ) : (
                <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Vendor
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete Vendor</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to delete this vendor? This action cannot be undone.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                      <Button 
                        variant="destructive" 
                        onClick={handleDeleteVendor}
                        disabled={saving}
                      >
                        {saving ? "Deleting..." : "Delete Vendor"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )
            ) : (
              <RoleBasedComponent requiredRole={UserRole.Admin}>
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditMode(true)}
                  className="w-full"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Vendor Details
                </Button>
              </RoleBasedComponent>
            )}
          </CardFooter>
        </Card>
        
        {/* Right column: Commission rates, bookings, and documents */}
        <div className="lg:col-span-2 space-y-6">
          {/* Service Type Commission Rates */}
          <ServiceTypeCommissions
            vendorId={id}
            isNewVendor={isNewVendor}
            serviceTypes={serviceTypes}
            onCommissionsChange={setServiceTypeCommissions}
            defaultCommissionRate={formData.commissionRate}
          />
          
          {/* Bookings and Documents - only show for existing vendors */}
          {!isNewVendor && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Bookings Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Booking History</CardTitle>
                </CardHeader>
                <CardContent>
                  <BookingHistory bookings={bookings} />
                </CardContent>
              </Card>

              {/* Documents Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  <DocumentsList documents={documents} />
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorDetailPage;

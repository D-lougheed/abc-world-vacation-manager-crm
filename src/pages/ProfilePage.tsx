
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Save } from 'lucide-react';

const ProfilePage = () => {
  const { user, updateUserProfile, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [agentCommissionPercentage, setAgentCommissionPercentage] = useState<number | null | undefined>(undefined);
  
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setAgentCommissionPercentage(user.agentCommissionPercentage);
    }
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSaving(true);

    const commission = agentCommissionPercentage === undefined || agentCommissionPercentage === null ? null : Number(agentCommissionPercentage);

    if (commission !== null && (isNaN(commission) || commission < 0 || commission > 100)) {
      toast({
        title: "Invalid Commission Percentage",
        description: "Commission must be a number between 0 and 100, or empty.",
        variant: "destructive",
      });
      setIsSaving(false);
      return;
    }

    const success = await updateUserProfile({
      firstName,
      lastName,
      agentCommissionPercentage: commission,
    });

    if (success) {
      toast({ title: "Profile Updated", description: "Your profile details have been saved." });
    }
    setIsSaving(false);
  };

  if (authLoading && !user) {
    return <p>Loading profile...</p>;
  }

  if (!user) {
    return <p>User not found. Please log in.</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">My Profile</h1>
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>View and update your personal details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} disabled={isSaving} />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} disabled={isSaving} />
            </div>
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={user.email || ''} disabled readOnly />
            <p className="text-sm text-muted-foreground mt-1">To change your email, please go to Settings.</p>
          </div>
          <div>
            <Label htmlFor="agentCommissionPercentage">Agent Commission Percentage (%)</Label>
            <Input 
              id="agentCommissionPercentage" 
              type="number"
              value={agentCommissionPercentage === null || agentCommissionPercentage === undefined ? '' : agentCommissionPercentage} 
              onChange={(e) => setAgentCommissionPercentage(e.target.value === '' ? null : parseFloat(e.target.value))} 
              placeholder="e.g., 10"
              disabled={isSaving} 
            />
          </div>
          <div>
            <Label>Accepting New Bookings</Label>
            <Input value={user.acceptingNewBookings ? "Yes" : "No"} disabled readOnly />
             <p className="text-sm text-muted-foreground mt-1">To change this, please go to Settings.</p>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSaveProfile} disabled={isSaving || authLoading}>
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;

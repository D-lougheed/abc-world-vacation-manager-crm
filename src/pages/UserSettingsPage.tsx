
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Save } from 'lucide-react';

const UserSettingsPage = () => {
  const { user, updateUserProfile, updateUserEmail, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [acceptingNewBookings, setAcceptingNewBookings] = useState(true);
  
  const [isSavingEmail, setIsSavingEmail] = useState(false);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);

  useEffect(() => {
    if (user) {
      setEmail(user.email || '');
      setAcceptingNewBookings(user.acceptingNewBookings !== undefined ? user.acceptingNewBookings : true);
    }
  }, [user]);

  const handleSaveEmail = async () => {
    if (!user || email === user.email) return;
    setIsSavingEmail(true);
    const success = await updateUserEmail(email);
    if (success) {
      // Toast is handled in AuthContext
    }
    setIsSavingEmail(false);
  };

  const handleSavePreferences = async () => {
    if (!user) return;
    setIsSavingPreferences(true);
    const success = await updateUserProfile({
      acceptingNewBookings,
    });
    if (success) {
      // Toast is handled in AuthContext
    }
    setIsSavingPreferences(false);
  };
  
  if (authLoading && !user) {
    return <p>Loading settings...</p>;
  }

  if (!user) {
    return <p>User not found. Please log in.</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">User Settings</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Account Email</CardTitle>
          <CardDescription>Change the email address associated with your account.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isSavingEmail} />
             <p className="text-sm text-muted-foreground mt-1">A confirmation will be sent to your new email address.</p>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSaveEmail} disabled={isSavingEmail || authLoading || email === user.email}>
              <Save className="mr-2 h-4 w-4" />
              {isSavingEmail ? 'Saving...' : 'Update Email'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Booking Preferences</CardTitle>
          <CardDescription>Manage your availability for new bookings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch 
              id="acceptingNewBookings" 
              checked={acceptingNewBookings} 
              onCheckedChange={setAcceptingNewBookings}
              disabled={isSavingPreferences}
            />
            <Label htmlFor="acceptingNewBookings">Accepting New Bookings</Label>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSavePreferences} disabled={isSavingPreferences || authLoading}>
              <Save className="mr-2 h-4 w-4" />
              {isSavingPreferences ? 'Saving...' : 'Save Preferences'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserSettingsPage;

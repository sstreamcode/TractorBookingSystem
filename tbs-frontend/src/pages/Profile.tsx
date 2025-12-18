import { useEffect, useState, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { User, Mail, Settings, Save, Camera, MapPin, Loader2, Phone } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { updateProfile, uploadImage } from '@/lib/api';
import { toast } from 'sonner';
import { getInitials, getAvatarColor, getImageUrlWithCacheBust } from '@/lib/utils';

const Profile = () => {
  const { isAuthenticated, user, loading: authLoading, refreshUser, isSuperAdmin } = useAuth();
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [profilePictureUrl, setProfilePictureUrl] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isFetchingAddress, setIsFetchingAddress] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (user && !editing && !saving) {
      // Only sync from user context when not editing and not saving to avoid resetting user input
      setName(user.name || '');
      setEmail(user.email || '');
      setProfilePictureUrl(user.profilePictureUrl || '');
      // Fetch phone and address from backend /api/auth/me endpoint
      const fetchUserDetails = async () => {
        try {
          const BASE_URL = (import.meta as any).env.VITE_API_BASE_URL ?? 'http://localhost:8082';
          const token = localStorage.getItem('token');
          if (token) {
            const meResponse = await fetch(`${BASE_URL}/api/auth/me`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (meResponse.ok) {
              const me = await meResponse.json();
              setPhone(me.phone || '');
              setAddress(me.address || '');
            }
          }
        } catch (error) {
          console.error('Failed to fetch user details:', error);
        }
      };
      fetchUserDetails();
    }
  }, [user, editing, saving]);

  const handleFetchCurrentAddress = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }

    setIsFetchingAddress(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
          );
          const data = await response.json();
          if (data.display_name) {
            setAddress(data.display_name);
            toast.success('Address fetched successfully!');
          } else {
            toast.error('Could not determine address from location.');
          }
        } catch (error) {
          console.error('Reverse geocoding error:', error);
          toast.error('Failed to fetch address. Please enter manually.');
        } finally {
          setIsFetchingAddress(false);
        }
      },
      (error) => {
        setIsFetchingAddress(false);
        if (error.code === error.PERMISSION_DENIED) {
          toast.error('Location permission denied. Please allow location access or enter address manually.');
        } else {
          toast.error('Unable to access your location. Please enter address manually.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="mx-auto max-w-6xl px-4 py-8">
          <p className="text-slate-100">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Redirect super admin to their portal if they try to access profile
  if (isSuperAdmin) {
    return <Navigate to="/super-admin/dashboard" replace />;
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const { url } = await uploadImage(file);
      
      // Auto-save the profile picture
      const response = await updateProfile(undefined, url, phone, address);
      
      // Update local storage with response from backend
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const userObj = JSON.parse(storedUser);
        userObj.profilePictureUrl = response.user.profilePictureUrl || url;
        localStorage.setItem('user', JSON.stringify(userObj));
      }
      
      // Update local state immediately from response
      setProfilePictureUrl(response.user.profilePictureUrl || url);
      
      // Refresh user context to sync with backend (await it)
      await refreshUser();
      
      toast.success('Profile picture updated');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Name cannot be empty');
      return;
    }
    
    setSaving(true);
    try {
      const response = await updateProfile(name, undefined, phone, address);
      
      // Update local state immediately from response (before refreshing context)
      const updatedName = response.user.name;
      const updatedPhone = response.user.phone || '';
      const updatedAddress = response.user.address || '';
      // Preserve existing profilePictureUrl if response doesn't have one (when only updating name)
      const updatedProfilePic = response.user.profilePictureUrl || profilePictureUrl;
      
      setName(updatedName);
      setPhone(updatedPhone);
      setAddress(updatedAddress);
      setProfilePictureUrl(updatedProfilePic);
      
      // Update local storage with response from backend
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const userObj = JSON.parse(storedUser);
        userObj.name = updatedName;
        // Only update profilePictureUrl if we got a new one, otherwise preserve existing
        if (response.user.profilePictureUrl) {
          userObj.profilePictureUrl = response.user.profilePictureUrl;
        }
        localStorage.setItem('user', JSON.stringify(userObj));
      }
      
      // Refresh user context to sync with backend (await it)
      await refreshUser();
      
      // Exit edit mode after everything is updated
      setEditing(false);
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };


  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-foreground">{t('profile.title')}</h1>
          <p className="text-muted-foreground">{t('profile.subtitle')}</p>
        </div>

        {/* Profile Card */}
        <Card className="border border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center">
              <Settings className="mr-2 h-5 w-5" />
              {t('profile.information')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar Section */}
            <div className="flex flex-col items-center py-6">
              <div className="relative">
                <Avatar className="w-32 h-32 mb-4">
                  <AvatarImage src={getImageUrlWithCacheBust(profilePictureUrl)} alt={name} />
                  <AvatarFallback className={`${getAvatarColor(name || email || 'User')} text-white text-4xl font-semibold`}>
                    {getInitials(name || email || 'U')}
                  </AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute bottom-0 right-0 bg-amber-500 text-slate-900 rounded-full p-2 shadow-md hover:bg-amber-600 transition-colors disabled:opacity-50"
                >
                  <Camera className="h-5 w-5" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
              <h2 className="text-2xl font-bold text-foreground">{name}</h2>
              <p className="text-muted-foreground">{email}</p>
              {uploading && <p className="text-sm text-muted-foreground">{t('profile.uploading')}</p>}
            </div>

            {/* Divider */}
            <div className="border-t border-border"></div>

            {/* Form Fields */}
            <div className="space-y-6 max-w-2xl mx-auto">
              {/* Name Field */}
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center text-sm font-medium text-foreground">
                  <User className="mr-2 h-4 w-4" />
                  {t('profile.fullName')}
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!editing}
                  className="w-full bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-amber-500"
                  placeholder={t('profile.enterName')}
                />
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center text-sm font-medium text-foreground">
                  <Mail className="mr-2 h-4 w-4" />
                  {t('profile.emailAddress')}
                </Label>
                <Input
                  id="email"
                  value={email}
                  disabled
                  className="w-full bg-muted border-border text-muted-foreground"
                  placeholder="your.email@example.com"
                />
                <p className="text-xs text-muted-foreground">{t('profile.emailCannotChange')}</p>
              </div>

              {/* Phone Field */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center text-sm font-medium text-foreground">
                  <Phone className="mr-2 h-4 w-4" />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={!editing}
                  className="w-full bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-amber-500"
                  placeholder="98XXXXXXXX"
                />
              </div>

              {/* Address Field */}
              <div className="space-y-2">
                <Label htmlFor="address" className="flex items-center text-sm font-medium text-foreground">
                  <MapPin className="mr-2 h-4 w-4" />
                  Address
                </Label>
                <div className="relative">
                  <Input
                    id="address"
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    disabled={!editing}
                    className="w-full bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-amber-500 pr-12"
                    placeholder="City, District"
                  />
                  {editing && (
                    <button
                      type="button"
                      onClick={handleFetchCurrentAddress}
                      disabled={isFetchingAddress}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Fetch current location address"
                    >
                      {isFetchingAddress ? (
                        <Loader2 className="h-5 w-5 text-amber-500 animate-spin" />
                      ) : (
                        <MapPin className="h-5 w-5 text-amber-500" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4">
                {editing ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditing(false);
                        setName(user?.name || '');
                        // Reset phone and address from backend
                        const fetchUserDetails = async () => {
                          try {
                            const BASE_URL = (import.meta as any).env.VITE_API_BASE_URL ?? 'http://localhost:8082';
                            const token = localStorage.getItem('token');
                            if (token) {
                              const meResponse = await fetch(`${BASE_URL}/api/auth/me`, {
                                headers: { Authorization: `Bearer ${token}` },
                              });
                              if (meResponse.ok) {
                                const me = await meResponse.json();
                                setPhone(me.phone || '');
                                setAddress(me.address || '');
                              }
                            }
                          } catch (error) {
                            console.error('Failed to fetch user details:', error);
                          }
                        };
                        fetchUserDetails();
                      }}
                      disabled={saving}
                      className="border-border text-muted-foreground hover:bg-muted"
                    >
                      {t('profile.cancel')}
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      className="bg-amber-500 hover:bg-amber-600 text-slate-900"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {saving ? t('profile.saving') : t('profile.saveChanges')}
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => setEditing(true)}
                    className="bg-amber-500 hover:bg-amber-600 text-slate-900"
                  >
                    {t('profile.editProfile')}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;


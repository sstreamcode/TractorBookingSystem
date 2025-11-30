import { useEffect, useState, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { User, Mail, Settings, Save, Camera } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { updateProfile, uploadImage } from '@/lib/api';
import { toast } from 'sonner';
import { getInitials, getAvatarColor, getImageUrlWithCacheBust } from '@/lib/utils';

const Profile = () => {
  const { isAuthenticated, user, loading: authLoading, refreshUser } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [profilePictureUrl, setProfilePictureUrl] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (user && !editing && !saving) {
      // Only sync from user context when not editing and not saving to avoid resetting user input
      setName(user.name || '');
      setEmail(user.email || '');
      setProfilePictureUrl(user.profilePictureUrl || '');
    }
  }, [user, editing, saving]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900">
        <Navbar />
        <div className="mx-auto max-w-6xl px-4 py-8">
          <p className="text-slate-100">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
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
      const response = await updateProfile(undefined, url);
      
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
      const response = await updateProfile(name);
      
      // Update local state immediately from response (before refreshing context)
      const updatedName = response.user.name;
      // Preserve existing profilePictureUrl if response doesn't have one (when only updating name)
      const updatedProfilePic = response.user.profilePictureUrl || profilePictureUrl;
      
      setName(updatedName);
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
    <div className="min-h-screen bg-slate-900">
      <Navbar />
      
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-slate-100">My Profile</h1>
          <p className="text-slate-400">Manage your account information</p>
        </div>

        {/* Profile Card */}
        <Card className="border border-slate-700 bg-slate-800 shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-100 flex items-center">
              <Settings className="mr-2 h-5 w-5" />
              Profile Information
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
              <h2 className="text-2xl font-bold text-slate-100">{name}</h2>
              <p className="text-slate-400">{email}</p>
              {uploading && <p className="text-sm text-slate-400">Uploading...</p>}
            </div>

            {/* Divider */}
            <div className="border-t border-slate-700"></div>

            {/* Form Fields */}
            <div className="space-y-6 max-w-2xl mx-auto">
              {/* Name Field */}
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center text-sm font-medium text-slate-200">
                  <User className="mr-2 h-4 w-4" />
                  Full Name
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!editing}
                  className="w-full bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-amber-500"
                  placeholder="Enter your name"
                />
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center text-sm font-medium text-slate-200">
                  <Mail className="mr-2 h-4 w-4" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  value={email}
                  disabled
                  className="w-full bg-slate-900 border-slate-700 text-slate-400"
                  placeholder="your.email@example.com"
                />
                <p className="text-xs text-slate-500">Email cannot be changed</p>
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
                      }}
                      disabled={saving}
                      className="border-slate-700 text-slate-300 hover:bg-slate-700"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      className="bg-amber-500 hover:bg-amber-600 text-slate-900"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => setEditing(true)}
                    className="bg-amber-500 hover:bg-amber-600 text-slate-900"
                  >
                    Edit Profile
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


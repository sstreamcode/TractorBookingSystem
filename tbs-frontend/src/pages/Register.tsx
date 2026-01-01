import { useState, useEffect, useRef } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Tractor, MapPin, Loader2, Eye, EyeOff, Upload, X, FileImage, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { uploadImageWithProgress } from '@/lib/api';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'customer' | 'tractor_owner'>('customer');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingAddress, setIsFetchingAddress] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [citizenshipImage, setCitizenshipImage] = useState<File | null>(null);
  const [citizenshipImageUrl, setCitizenshipImageUrl] = useState<string>('');
  const [uploadingCitizenship, setUploadingCitizenship] = useState(false);
  const [citizenshipPreview, setCitizenshipPreview] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { register, isAuthenticated, isSuperAdmin, isAdmin, isTractorOwner, loading: authLoading } = useAuth();
  const { t } = useLanguage();

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      if (isSuperAdmin) {
        window.location.href = '/super-admin/dashboard';
      } else if (isTractorOwner) {
        window.location.href = '/tractor-owner/dashboard';
      } else if (isAdmin) {
        window.location.href = '/admin/dashboard';
      } else {
        window.location.href = '/tractors';
      }
    }
  }, [isAuthenticated, isSuperAdmin, isAdmin, isTractorOwner, authLoading]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    if (isSuperAdmin) return <Navigate to="/super-admin/dashboard" replace />;
    if (isTractorOwner) return <Navigate to="/tractor-owner/dashboard" replace />;
    if (isAdmin) return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to="/tractors" replace />;
  }

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

  // Validate Nepal phone number: 10 digits, starting with 98 or 97
  const validateNepalPhone = (phoneNumber: string): boolean => {
    // Remove any spaces or dashes
    const cleaned = phoneNumber.replace(/\s|-/g, '');
    // Check if it's exactly 10 digits and starts with 98 or 97
    const phoneRegex = /^(98|97)\d{8}$/;
    return phoneRegex.test(cleaned);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
    // Limit to 10 digits
    const limitedValue = value.slice(0, 10);
    setPhone(limitedValue);
    
    // Validate phone number
    if (limitedValue.length > 0 && limitedValue.length < 10) {
      setPhoneError('Phone number must be 10 digits');
    } else if (limitedValue.length === 10) {
      if (!validateNepalPhone(limitedValue)) {
        setPhoneError('Phone number must start with 98 or 97');
      } else {
        setPhoneError('');
      }
    } else {
      setPhoneError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !password || !confirmPassword || !phone || !address) {
      toast.error(t('auth.fillAllFields'));
      return;
    }

    // Validate phone number
    if (!validateNepalPhone(phone)) {
      toast.error('Please enter a valid Nepal phone number (10 digits starting with 98 or 97)');
      setPhoneError('Phone number must be 10 digits starting with 98 or 97');
      return;
    }

    if (password !== confirmPassword) {
      toast.error(t('auth.passwordsDontMatch'));
      return;
    }

    if (password.length < 6) {
      toast.error(t('auth.passwordMinLength'));
      return;
    }

    // Validate citizenship image for tractor owners
    if (role === 'tractor_owner' && !citizenshipImageUrl) {
      toast.error('Please upload your citizenship document. This is required for tractor owner registration.');
      return;
    }

    setIsLoading(true);
    try {
      await register(name, email, password, role, phone, address, citizenshipImageUrl || undefined);
    } catch (error) {
      console.error('Registration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const processFile = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (JPG, PNG, etc.)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setCitizenshipImage(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setCitizenshipPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload image
    setUploadingCitizenship(true);
    try {
      const result = await uploadImageWithProgress(file, (progress) => {
        // Progress callback (optional, can show progress bar)
      });
      setCitizenshipImageUrl(result.url);
      toast.success('Citizenship document uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload citizenship document. Please try again.');
      setCitizenshipImage(null);
      setCitizenshipPreview('');
    } finally {
      setUploadingCitizenship(false);
    }
  };

  const handleCitizenshipImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const handleRemoveCitizenshipImage = () => {
    setCitizenshipImage(null);
    setCitizenshipImageUrl('');
    setCitizenshipPreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background text-foreground relative overflow-hidden">
      <div className="w-full max-w-md relative z-10">
        {/* Prominent Branding Section */}
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center justify-center gap-4 mb-8 group">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500 text-slate-900 shadow-xl group-hover:shadow-2xl transition-all duration-300 group-hover:scale-110">
              <Tractor className="h-8 w-8" />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-3xl font-bold leading-tight text-foreground group-hover:text-amber-500 transition-colors">
                Tractor Sewa
              </span>
              <span className="text-xs uppercase tracking-wider text-muted-foreground leading-tight font-semibold">
                {t('brand.subtitle')}
              </span>
            </div>
          </Link>
          <h1 className="text-5xl font-bold mb-4 text-foreground">{t('auth.getStarted')}</h1>
          <p className="text-lg text-muted-foreground font-medium">{t('auth.getStartedDesc')}</p>
        </div>

        <Card className="border border-border shadow-2xl bg-card backdrop-blur-sm">
          <CardHeader className="space-y-2 pb-6 pt-8">
            <CardTitle className="text-3xl font-bold text-foreground">{t('auth.register.title')}</CardTitle>
            <CardDescription className="text-base font-medium text-muted-foreground">
              {t('auth.register.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Role selection */}
              <div className="space-y-2">
                <Label className="text-sm font-bold text-foreground">Account Type</Label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('customer')}
                    className={`flex-1 px-3 py-2 rounded-xl border-2 text-sm font-medium transition-all ${
                      role === 'customer'
                        ? 'border-amber-500 bg-amber-500/10 text-amber-500'
                        : 'border-input bg-background text-foreground hover:border-amber-500/60'
                    }`}
                  >
                    Customer
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('tractor_owner')}
                    className={`flex-1 px-3 py-2 rounded-xl border-2 text-sm font-medium transition-all ${
                      role === 'tractor_owner'
                        ? 'border-amber-500 bg-amber-500/10 text-amber-500'
                        : 'border-input bg-background text-foreground hover:border-amber-500/60'
                    }`}
                  >
                    Tractor Owner
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-bold text-foreground">{t('auth.fullName')}</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder={t('auth.namePlaceholder')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-12 text-base rounded-xl border-2 border-input bg-background text-foreground placeholder:text-muted-foreground focus:border-amber-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-bold text-foreground">{t('auth.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t('auth.emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 text-base rounded-xl border-2 border-input bg-background text-foreground placeholder:text-muted-foreground focus:border-amber-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-bold text-foreground">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="98XXXXXXXX or 97XXXXXXXX"
                  value={phone}
                  onChange={handlePhoneChange}
                  className={`h-12 text-base rounded-xl border-2 bg-background text-foreground placeholder:text-muted-foreground focus:border-amber-500 ${
                    phoneError ? 'border-red-500 focus:border-red-500' : 'border-input'
                  }`}
                  required
                />
                {phoneError && (
                  <p className="text-sm text-red-500 mt-1">{phoneError}</p>
                )}
                {phone && !phoneError && phone.length === 10 && (
                  <p className="text-sm text-green-500 mt-1">✓ Valid Nepal phone number</p>
                )}
                <p className="text-xs text-muted-foreground">10 digits starting with 98 or 97</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-bold text-foreground">Address</Label>
                <div className="relative">
                  <Input
                    id="address"
                    type="text"
                    placeholder="City, District"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="h-12 text-base rounded-xl border-2 border-input bg-background text-foreground placeholder:text-muted-foreground focus:border-amber-500 pr-12"
                    required
                  />
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
                </div>
              </div>

              {/* Citizenship Image Upload - Only for Tractor Owners */}
              {role === 'tractor_owner' && (
                <div className="space-y-2">
                  <Label htmlFor="citizenship" className="text-sm font-bold text-foreground">
                    Citizenship Document <span className="text-red-500">*</span>
                  </Label>
                  
                  {!citizenshipImageUrl ? (
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={handleUploadClick}
                      className={`
                        relative border-2 border-dashed rounded-xl p-6 transition-all cursor-pointer
                        ${isDragging 
                          ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20' 
                          : 'border-input hover:border-amber-500/60 hover:bg-muted/30'
                        }
                        ${uploadingCitizenship ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                    >
                      <input
                        ref={fileInputRef}
                        id="citizenship"
                        type="file"
                        accept="image/*"
                        onChange={handleCitizenshipImageChange}
                        disabled={uploadingCitizenship}
                        className="hidden"
                        required={role === 'tractor_owner'}
                      />
                      
                      <div className="flex flex-col items-center justify-center gap-3 text-center">
                        {uploadingCitizenship ? (
                          <>
                            <Loader2 className="h-10 w-10 text-amber-500 animate-spin" />
                            <div>
                              <p className="text-sm font-medium text-foreground">Uploading...</p>
                              <p className="text-xs text-muted-foreground mt-1">Please wait</p>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10">
                              <Upload className="h-6 w-6 text-amber-500" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-foreground">
                                {isDragging ? 'Drop your file here' : 'Click to upload or drag and drop'}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                PNG, JPG, JPEG up to 5MB
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="border-2 border-green-500/30 rounded-xl p-4 bg-green-50/50 dark:bg-green-950/20">
                        <div className="flex items-start gap-4">
                          {citizenshipPreview && (
                            <div className="relative flex-shrink-0">
                              <img
                                src={citizenshipPreview}
                                alt="Citizenship preview"
                                className="h-24 w-36 object-cover rounded-lg border-2 border-border shadow-sm"
                              />
                              <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1 shadow-lg">
                                <CheckCircle2 className="h-4 w-4 text-white" />
                              </div>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <FileImage className="h-4 w-4 text-green-600" />
                              <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                                Document uploaded successfully
                              </p>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {citizenshipImage?.name || 'Citizenship document'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {(citizenshipImage?.size || 0) / 1024 / 1024 < 1
                                ? `${Math.round((citizenshipImage?.size || 0) / 1024)} KB`
                                : `${((citizenshipImage?.size || 0) / 1024 / 1024).toFixed(2)} MB`}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveCitizenshipImage();
                            }}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 flex-shrink-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <button
                        type="button"
                        onClick={handleUploadClick}
                        disabled={uploadingCitizenship}
                        className="w-full h-10 text-sm font-medium rounded-lg border-2 border-input bg-background hover:bg-muted hover:border-amber-500/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-foreground"
                      >
                        Change Document
                      </button>
                      
                      <input
                        ref={fileInputRef}
                        id="citizenship-change"
                        type="file"
                        accept="image/*"
                        onChange={handleCitizenshipImageChange}
                        disabled={uploadingCitizenship}
                        className="hidden"
                      />
                    </div>
                  )}
                  
                  <div className="rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 p-3">
                    <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                      <strong className="font-semibold">Important:</strong> Upload a clear, readable image of your citizenship document. 
                      This will be reviewed by the admin before your account is approved. Ensure all details are visible and the image is not blurry.
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-bold text-foreground">{t('auth.password')}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t('auth.passwordCreatePlaceholder')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 text-base rounded-xl border-2 border-input bg-background text-foreground placeholder:text-muted-foreground focus:border-amber-500 pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-bold text-foreground">{t('auth.confirmPassword')}</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder={t('auth.passwordConfirmPlaceholder')}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-12 text-base rounded-xl border-2 border-input bg-background text-foreground placeholder:text-muted-foreground focus:border-amber-500 pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 text-base font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-900 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]" 
                disabled={isLoading}
              >
                {isLoading ? t('auth.creatingAccount') : t('auth.createAccount')}
              </Button>

              <p className="text-center text-sm text-muted-foreground pt-2 font-medium">
                {t('auth.alreadyHaveAccount')}{' '}
                <Link to="/login" className="text-amber-500 font-bold hover:text-amber-400 hover:underline transition-colors">
                  {t('auth.signIn')}
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;

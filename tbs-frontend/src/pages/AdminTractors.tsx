import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Plus, Edit, Trash2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuth } from '@/contexts/AuthContext';
import { getTractorsForUI, deleteTractor, createTractor, updateTractor, uploadImageWithProgress } from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Tractor } from '@/types';
import { toast } from 'sonner';

const AdminTractors = () => {
  const { isAuthenticated, isAdmin, loading: authLoading } = useAuth();
  const [tractors, setTractors] = useState<Tractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    model: '',
    hourlyRate: '',
    imageUrl: '',
    available: true,
    description: '',
    location: '',
    horsePower: '',
    fuelType: 'Diesel',
    fuelLevel: '80',
    rating: '4.5',
    totalBookings: '0',
    status: 'Available',
    nextAvailableDate: '',
    nextAvailableTime: '',
    category: 'Utility',
  });
  const [files, setFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [preview, setPreview] = useState<string>('https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&q=80');
  const [progress, setProgress] = useState<number>(0);
  const [tab, setTab] = useState<'upload' | 'url'>('upload');

  useEffect(() => {
    (async () => {
      try {
        const data = await getTractorsForUI();
        setTractors(data);
      } catch (e) {
        setError('Failed to load tractors');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Wait for auth to finish loading before redirecting
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  const handleAdd = async () => {
    try {
      if (!form.name || !form.model || !form.hourlyRate) {
        toast.error('Please fill all fields');
        return;
      }
      const rate = Number(form.hourlyRate);
      if (Number.isNaN(rate) || rate <= 0) {
        toast.error('Hourly rate must be a positive number');
        return;
      }
      const horsePower = form.horsePower ? Number(form.horsePower) : undefined;
      const fuelLevel = form.fuelLevel ? Number(form.fuelLevel) : undefined;
      const rating = form.rating ? Number(form.rating) : undefined;
      const totalBookings = form.totalBookings ? Number(form.totalBookings) : undefined;
      const nextAvailableAt = form.nextAvailableDate && form.nextAvailableTime
        ? `${form.nextAvailableDate}T${form.nextAvailableTime}`
        : undefined;
      let finalUrl = form.imageUrl || '';
      const uploadedUrls: string[] = [];
      if (!finalUrl && files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          const up = await uploadImageWithProgress(files[i], setProgress);
          uploadedUrls.push(up.url);
        }
        finalUrl = uploadedUrls[0];
      }
      if (editingId) {
        const mergedImages = uploadedUrls.length ? uploadedUrls : existingImages;
        await updateTractor(editingId, {
          name: form.name,
          model: form.model,
          hourlyRate: rate,
          available: form.available,
          imageUrl: finalUrl || mergedImages[0],
          imageUrls: mergedImages,
          description: form.description,
          location: form.location || undefined,
          horsePower,
          fuelType: form.fuelType || undefined,
          fuelLevel,
          rating,
          totalBookings,
          status: form.status,
          nextAvailableAt,
          category: form.category || undefined,
        });
        setTractors(prev => prev.map(t => t.id === editingId ? {
          ...t,
          name: form.name,
          model: form.model,
          hourlyRate: rate,
          available: form.available,
          image: finalUrl || mergedImages[0] || t.image,
          images: mergedImages.length ? mergedImages : t.images,
          location: form.location || t.location,
          horsePower: horsePower ?? t.horsePower,
          fuelType: form.fuelType || t.fuelType,
          fuelLevel: fuelLevel ?? t.fuelLevel,
          rating: rating ?? t.rating,
          totalBookings: totalBookings ?? t.totalBookings,
          status: form.status || t.status,
          nextAvailableAt: nextAvailableAt || t.nextAvailableAt,
          category: form.category || t.category,
        } : t));
        toast.success('Tractor updated');
      } else {
        const created = await createTractor({
          name: form.name,
          model: form.model,
          hourlyRate: rate,
          available: form.available,
          imageUrl: finalUrl || undefined,
          imageUrls: uploadedUrls.length ? uploadedUrls : undefined,
          description: form.description,
          location: form.location || undefined,
          horsePower,
          fuelType: form.fuelType || undefined,
          fuelLevel,
          rating,
          totalBookings,
          status: form.status,
          nextAvailableAt,
          category: form.category || undefined,
        });
        setTractors(prev => [
          {
            id: String(created.id),
            name: created.name,
            model: created.model,
            image: created.imageUrl || preview,
            images: created.imageUrls,
            hourlyRate: created.hourlyRate,
            location: created.location || 'Kathmandu',
            horsePower: created.horsePower || 60,
            fuelType: created.fuelType || 'Diesel',
            available: created.available,
            description: created.description || '',
            fuelLevel: created.fuelLevel ?? 0,
            rating: created.rating ?? 0,
            totalBookings: created.totalBookings ?? 0,
            status: created.status || (created.available ? 'Available' : 'Unavailable'),
            nextAvailableAt: created.nextAvailableAt,
            category: created.category || 'Utility',
          },
          ...prev
        ]);
        toast.success('Tractor added');
      }
      setOpen(false);
      setForm({
        name: '',
        model: '',
        hourlyRate: '',
        imageUrl: '',
        available: true,
        description: '',
        location: '',
        horsePower: '',
        fuelType: 'Diesel',
        fuelLevel: '80',
        rating: '4.5',
        totalBookings: '0',
        status: 'Available',
        nextAvailableDate: '',
        nextAvailableTime: '',
        category: 'Utility',
      });
      setEditingId(null);
      setFiles([]);
      setExistingImages([]);
      setPreview('https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&q=80');
      setProgress(0);
      setTab('upload');
    } catch (e) {
      toast.error('Failed to add tractor');
    }
  };

  const handleEdit = (id: string) => {
    const found = tractors.find(t => t.id === id);
    if (!found) return;
    setEditingId(id);
    const imgs = found.images || [];
    setExistingImages(imgs);
    // Split nextAvailableAt into date + time for better UX
    let nextAvailableDate = '';
    let nextAvailableTime = '';
    if (found.nextAvailableAt && found.nextAvailableAt.includes('T')) {
      const [d, t] = found.nextAvailableAt.split('T');
      nextAvailableDate = d;
      nextAvailableTime = t?.slice(0,5) || '';
    }
    setForm({
      name: found.name,
      model: found.model,
      hourlyRate: String(found.hourlyRate),
      imageUrl: imgs[0] || found.image,
      available: found.available,
      description: found.description,
      location: found.location || '',
      horsePower: found.horsePower ? String(found.horsePower) : '',
      fuelType: found.fuelType || 'Diesel',
      fuelLevel: found.fuelLevel ? String(found.fuelLevel) : '80',
      rating: found.rating ? String(found.rating) : '4.5',
      totalBookings: found.totalBookings ? String(found.totalBookings) : '0',
      status: found.status || (found.available ? 'Available' : 'Unavailable'),
      nextAvailableDate,
      nextAvailableTime,
      category: found.category || 'Utility',
    });
    setPreview(imgs[0] || found.image);
    setFiles([]);
    setProgress(0);
    setTab('upload');
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTractor(id);
      setTractors(prev => prev.filter(t => t.id !== id));
      toast.success('Tractor deleted');
    } catch (e) {
      toast.error('Failed to delete tractor');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Manage Tractors</h1>
            <p className="text-muted-foreground">Add, edit, or remove tractors from your fleet</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Tractor
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? 'Edit Tractor' : 'Add Tractor'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-2">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start">
                  <div className="md:col-span-2">
                    <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
                      <TabsList className="grid grid-cols-2 w-full">
                        <TabsTrigger value="upload">Upload</TabsTrigger>
                        <TabsTrigger value="url">URL</TabsTrigger>
                      </TabsList>
                      <TabsContent value="upload" className="mt-3">
                        <label
                          htmlFor="tractor-images-input"
                          className="group relative aspect-[4/3] w-full cursor-pointer overflow-hidden rounded-xl border bg-muted hover:ring-2 hover:ring-primary/30 transition"
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            const picked = Array.from(e.dataTransfer.files || []);
                            const images = picked.filter(f => f.type.startsWith('image/')).slice(0, 6);
                            if (images.length > 0) {
                              setFiles(images);
                              setPreview(URL.createObjectURL(images[0]));
                              setForm(s => ({ ...s, imageUrl: '' }));
                            }
                          }}
                        >
                          <img src={form.imageUrl || preview} alt="Preview" className="h-full w-full object-cover" />
                        </label>
                        <div className="mt-3 space-y-2">
                          <div className="flex flex-wrap items-center gap-3">
                            <input
                              id="tractor-images-input"
                              className="sr-only"
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={(e) => {
                                const picked = Array.from(e.target.files || []);
                                const images = picked.filter(f => f.type.startsWith('image/')).slice(0, 6);
                                setFiles(images);
                                if (images[0]) setPreview(URL.createObjectURL(images[0]));
                                setForm(s => ({ ...s, imageUrl: '' }));
                              }}
                            />
                            <label
                              htmlFor="tractor-images-input"
                              className="inline-flex cursor-pointer items-center rounded-md border bg-white px-3 py-2 text-sm font-medium text-secondary shadow-sm transition hover:bg-muted"
                            >
                              Choose Files
                            </label>
                            {files.length > 0 && (
                              <span className="text-xs text-muted-foreground">{files.length} selected</span>
                            )}
                          </div>
                          {(existingImages.length > 0 || files.length > 0) && (
                            <div className="grid grid-cols-6 gap-2">
                              {existingImages.map((u, i) => (
                                <div key={`ex-${i}`} className="relative group">
                                  <img src={u} alt={`ex-${i}`} className="h-16 w-full object-cover rounded border" />
                                  <button
                                    className="absolute -top-2 -right-2 bg-destructive text-white rounded-full h-6 w-6 opacity-0 group-hover:opacity-100"
                                    onClick={() => setExistingImages(imgs => imgs.filter((_, idx) => idx !== i))}
                                  >×</button>
                                </div>
                              ))}
                              {files.slice(0, 6).map((f, i) => (
                                <div key={`new-${i}`} className="relative">
                                  <img src={URL.createObjectURL(f)} alt={`new-${i}`} className={"h-16 w-full object-cover rounded border" + (i === 0 ? ' ring-2 ring-primary' : '')} />
                                </div>
                              ))}
                            </div>
                          )}
                          {progress > 0 && (
                            <div className="w-full h-2 rounded bg-secondary">
                              <div className="h-2 rounded bg-primary transition-[width]" style={{ width: `${progress}%` }} />
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground">Tip: Use multiple images to showcase different angles.</p>
                        </div>
                      </TabsContent>
                      <TabsContent value="url" className="mt-3 space-y-2">
                        <label className="text-sm font-medium">Remote Image URL</label>
                        <Input value={form.imageUrl} onChange={e => setForm(s => ({ ...s, imageUrl: e.target.value }))} placeholder="https://..." />
                        <p className="text-xs text-muted-foreground">Paste a direct image link. Upload tab disabled while using URL.</p>
                      </TabsContent>
                    </Tabs>
                  </div>
                  <div className="md:col-span-3 space-y-4">
                  <div className="space-y-2">
                      <label className="text-sm font-medium">Name</label>
                      <Input value={form.name} onChange={e => setForm(s => ({ ...s, name: e.target.value }))} placeholder="e.g. Mahindra 575" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Model</label>
                      <Input value={form.model} onChange={e => setForm(s => ({ ...s, model: e.target.value }))} placeholder="e.g. 4WD" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Hourly Rate</label>
                      <Input type="number" value={form.hourlyRate} onChange={e => setForm(s => ({ ...s, hourlyRate: e.target.value }))} placeholder="e.g. 1500" />
                    </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Location</label>
                    <Input value={form.location} onChange={e => setForm(s => ({ ...s, location: e.target.value }))} placeholder="e.g. Depot A" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Horsepower (HP)</label>
                      <Input type="number" value={form.horsePower} onChange={e => setForm(s => ({ ...s, horsePower: e.target.value }))} placeholder="e.g. 80" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Fuel Type</label>
                      <Input value={form.fuelType} onChange={e => setForm(s => ({ ...s, fuelType: e.target.value }))} placeholder="e.g. Diesel" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Fuel Level (%)</label>
                      <Input type="number" min={0} max={100} value={form.fuelLevel} onChange={e => setForm(s => ({ ...s, fuelLevel: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Rating</label>
                      <Input type="number" step="0.1" min={0} max={5} value={form.rating} onChange={e => setForm(s => ({ ...s, rating: e.target.value }))} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Total Bookings</label>
                      <Input type="number" min={0} value={form.totalBookings} onChange={e => setForm(s => ({ ...s, totalBookings: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Status</label>
                      <Select value={form.status} onValueChange={(value)=>setForm(s=>({...s,status:value}))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Available">Available</SelectItem>
                          <SelectItem value="In Use">In Use</SelectItem>
                          <SelectItem value="Maintenance">Maintenance</SelectItem>
                          <SelectItem value="Unavailable">Unavailable</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Next Available Date</label>
                      <Input
                        type="date"
                        value={form.nextAvailableDate}
                        onChange={e => setForm(s => ({ ...s, nextAvailableDate: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Next Available Time</label>
                      <Input
                        type="time"
                        value={form.nextAvailableTime}
                        onChange={e => setForm(s => ({ ...s, nextAvailableTime: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Category</label>
                      <Input value={form.category} onChange={e => setForm(s => ({ ...s, category: e.target.value }))} placeholder="e.g. Utility" />
                    </div>
                  </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Description</label>
                      <textarea
                        className="w-full min-h-[100px] rounded-md border bg-background px-3 py-2 text-sm"
                        placeholder="Short description, features, conditions..."
                        value={form.description}
                        onChange={e => setForm(s => ({ ...s, description: e.target.value }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="text-sm font-medium">Available</div>
                        <div className="text-xs text-muted-foreground">Toggle to mark if tractor is available for booking</div>
                      </div>
                      <Switch checked={form.available} onCheckedChange={(v) => setForm(s => ({ ...s, available: v }))} />
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={handleAdd}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Tractors ({tractors.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && <p className="text-sm text-muted-foreground">Loading...</p>}
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Images</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Rate/Hour</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tractors.map((tractor) => (
                  <TableRow key={tractor.id}>
                    <TableCell>
                      <div className="flex gap-2 items-center">
                        <img src={tractor.image} alt={tractor.name} className="w-16 h-16 object-cover rounded border" />
                        {tractor.images?.slice(1, 4).map((u, i) => (
                          <img key={i} src={u} alt={`img-${i}`} className="w-12 h-12 object-cover rounded border" />
                        ))}
                        {tractor.images && tractor.images.length > 4 && (
                          <span className="text-xs text-muted-foreground">+{tractor.images.length - 4}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{tractor.name}</TableCell>
                    <TableCell>{tractor.model}</TableCell>
                    <TableCell>{tractor.location}</TableCell>
                    <TableCell>रू {tractor.hourlyRate}</TableCell>
                    <TableCell>
                      <Badge variant={tractor.available ? 'default' : 'secondary'}>
                        {tractor.available ? 'Available' : 'Unavailable'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(tractor.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(tractor.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminTractors;

import { useState } from 'react';
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
import { mockTractors } from '@/data/mockData';
import { toast } from 'sonner';

const AdminTractors = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  const [tractors] = useState(mockTractors);

  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  const handleAdd = () => {
    toast.info('Add tractor form would open here (TODO: Implement)');
  };

  const handleEdit = (id: string) => {
    toast.info(`Edit tractor ${id} (TODO: Implement)`);
  };

  const handleDelete = (id: string) => {
    toast.info(`Delete tractor ${id} (TODO: Implement)`);
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
          <Button onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Add Tractor
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Tractors ({tractors.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
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
                      <img
                        src={tractor.image}
                        alt={tractor.name}
                        className="w-16 h-16 object-cover rounded"
                      />
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

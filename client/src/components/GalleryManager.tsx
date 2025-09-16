import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Upload, Trash2, ImageIcon, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "../lib/queryClient";

interface SalonPhoto {
  id: string;
  salonId: string;
  url: string;
  publicId: string;
  createdAt: string;
}

interface GalleryManagerProps {
  salonId: string;
}

export default function GalleryManager({ salonId }: GalleryManagerProps) {
  const { toast } = useToast();
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);

  // Fetch salon photos
  const { data: photos = [], isLoading: photosLoading } = useQuery<SalonPhoto[]>({
    queryKey: ['salon-photos', salonId],
    queryFn: async () => {
      const response = await fetch(`/api/salons/${salonId}/photos`);
      if (!response.ok) {
        throw new Error('Failed to fetch photos');
      }
      return response.json();
    },
    enabled: !!salonId,
  });

  // Upload photos mutation
  const uploadPhotosMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const token = localStorage.getItem('smartq_token');
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append('image', file);
        
        const response = await fetch(`/api/salons/${salonId}/photos`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }
        
        return response.json();
      });
      
      return Promise.all(uploadPromises);
    },
    onSuccess: () => {
      toast({
        title: "Photos uploaded successfully!",
        description: "Your new photos have been added to the gallery.",
      });
      queryClient.invalidateQueries({ queryKey: ['salon-photos', salonId] });
      setSelectedImages([]);
      setIsUploadDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to upload photos",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete photo mutation
  const deletePhotoMutation = useMutation({
    mutationFn: async (photoId: string) => {
      const token = localStorage.getItem('smartq_token');
      const response = await fetch(`/api/salons/${salonId}/photos/${photoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete photo');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Photo deleted successfully!",
        description: "The photo has been removed from your gallery.",
      });
      queryClient.invalidateQueries({ queryKey: ['salon-photos', salonId] });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete photo",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleUpload = () => {
    if (selectedImages.length > 0) {
      uploadPhotosMutation.mutate(selectedImages);
    }
  };

  const handleDelete = (photoId: string) => {
    if (photos.length <= 1) {
      toast({
        title: "Cannot delete photo",
        description: "At least one photo is required for your salon.",
        variant: "destructive",
      });
      return;
    }

    if (confirm("Are you sure you want to delete this photo?")) {
      deletePhotoMutation.mutate(photoId);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <ImageIcon className="h-5 w-5" />
              <span>Photo Gallery</span>
            </CardTitle>
            <CardDescription>Manage your salon photos</CardDescription>
          </div>
          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Photos
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload New Photos</DialogTitle>
                <DialogDescription>
                  Add more photos to showcase your salon
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-border rounded-lg p-4">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setSelectedImages(files);
                    }}
                    className="w-full"
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    Select one or more photos to upload
                  </p>
                  {selectedImages.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-foreground">
                        Selected: {selectedImages.length} image{selectedImages.length !== 1 ? 's' : ''}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedImages.map((file, index) => (
                          <div key={index} className="relative">
                            <img
                              src={URL.createObjectURL(file)}
                              alt={`Preview ${index + 1}`}
                              className="w-16 h-16 object-cover rounded border"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedImages(prev => prev.filter((_, i) => i !== index));
                              }}
                              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={handleUpload}
                    disabled={selectedImages.length === 0 || uploadPhotosMutation.isPending}
                    className="flex-1"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {uploadPhotosMutation.isPending ? "Uploading..." : "Upload Photos"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedImages([]);
                      setIsUploadDialogOpen(false);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {photosLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-square bg-muted rounded-lg animate-pulse"></div>
            ))}
          </div>
        ) : photos.length === 0 ? (
          <div className="text-center py-8">
            <ImageIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No photos uploaded yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo) => (
              <div key={photo.id} className="relative group">
                <img
                  src={photo.url}
                  alt="Salon photo"
                  className="w-full aspect-square object-cover rounded-lg border"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center">
                  <Button
                    size="sm"
                    variant="destructive"
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    onClick={() => handleDelete(photo.id)}
                    disabled={deletePhotoMutation.isPending || photos.length <= 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                {photos.length <= 1 && (
                  <div className="absolute top-2 left-2">
                    <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                      Required
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

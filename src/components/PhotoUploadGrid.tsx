import { useState, useCallback } from 'react';
import { Camera, X, Plus, Lightbulb, GripVertical } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import imageCompression from 'browser-image-compression';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';

interface Photo {
  id: string;
  photo_url: string;
  order_index: number;
}

interface PhotoUploadGridProps {
  userId: string;
  profileId: string;
  photos: Photo[];
  onPhotosUpdate: () => void;
}

const SortablePhotoSlot = ({ photo, onDelete }: { photo: Photo | null; onDelete?: () => void }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: photo?.id || 'empty', disabled: !photo });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  if (!photo) {
    return (
      <div className="aspect-square rounded-2xl border-2 border-dashed border-border bg-muted/30 flex items-center justify-center">
        <Camera className="w-8 h-8 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="aspect-square rounded-2xl overflow-hidden relative group cursor-move"
      {...attributes}
      {...listeners}
    >
      <img src={photo.photo_url} alt="" className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
        <GripVertical className="w-6 h-6 text-white" />
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete?.();
        }}
        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
};

export const PhotoUploadGrid = ({ userId, profileId, photos, onPhotosUpdate }: PhotoUploadGridProps) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [showSheet, setShowSheet] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const compressImage = async (file: File): Promise<File> => {
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1080,
      useWebWorker: true,
      fileType: 'image/webp',
    };

    try {
      const compressedFile = await imageCompression(file, options);
      return new File([compressedFile], file.name.replace(/\.[^/.]+$/, '.webp'), {
        type: 'image/webp',
      });
    } catch (error) {
      console.error('Compression error:', error);
      return file;
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setShowSheet(false);

    try {
      const file = files[0];
      
      // Compress image
      const compressedFile = await compressImage(file);
      
      // Upload to Supabase Storage
      const fileExt = 'webp';
      const fileName = `${userId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(fileName, compressedFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(fileName);

      // Save to database
      const nextOrderIndex = photos.length;
      const { error: dbError } = await supabase
        .from('profile_photos')
        .insert({
          profile_id: profileId,
          photo_url: publicUrl,
          order_index: nextOrderIndex,
          is_primary: photos.length === 0,
        });

      if (dbError) throw dbError;

      toast({
        title: "Photo uploaded!",
        description: "Your photo has been added successfully.",
      });

      onPhotosUpdate();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload photo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleDelete = async (photoId: string, photoUrl: string) => {
    try {
      // Extract file path from URL
      const urlParts = photoUrl.split('/profile-photos/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        
        // Delete from storage
        await supabase.storage
          .from('profile-photos')
          .remove([filePath]);
      }

      // Delete from database
      const { error } = await supabase
        .from('profile_photos')
        .delete()
        .eq('id', photoId);

      if (error) throw error;

      toast({
        title: "Photo deleted",
        description: "Photo removed successfully.",
      });

      onPhotosUpdate();
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete photo.",
        variant: "destructive",
      });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = photos.findIndex((p) => p.id === active.id);
    const newIndex = photos.findIndex((p) => p.id === over.id);

    const reorderedPhotos = arrayMove(photos, oldIndex, newIndex);

    // Update order_index in database
    try {
      const updates = reorderedPhotos.map((photo, index) => ({
        id: photo.id,
        order_index: index,
      }));

      for (const update of updates) {
        await supabase
          .from('profile_photos')
          .update({ order_index: update.order_index })
          .eq('id', update.id);
      }

      onPhotosUpdate();
    } catch (error: any) {
      toast({
        title: "Reorder failed",
        description: "Failed to reorder photos.",
        variant: "destructive",
      });
    }
  };

  const handleSlotClick = (index: number) => {
    if (index < photos.length) return; // Don't open sheet for filled slots
    setSelectedSlot(index);
    setShowSheet(true);
  };

  const sortedPhotos = [...photos].sort((a, b) => a.order_index - b.order_index);
  const slots = Array.from({ length: 6 }, (_, i) => sortedPhotos[i] || null);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Pick your videos and photos</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Tap to edit, drag to reorder
        </p>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sortedPhotos.map((p) => p.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-3 gap-4">
            {slots.map((photo, index) => (
              <div key={photo?.id || `slot-${index}`} onClick={() => handleSlotClick(index)}>
                {photo ? (
                  <SortablePhotoSlot photo={photo} onDelete={() => handleDelete(photo.id, photo.photo_url)} />
                ) : (
                  <label className="block cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileSelect}
                      disabled={uploading}
                    />
                    <div className="aspect-square rounded-2xl border-2 border-dashed border-border bg-muted/30 flex flex-col items-center justify-center gap-2 hover:bg-muted/50 transition-colors">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Plus className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                  </label>
                )}
              </div>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Tap to edit, drag to reorder</span>
        <span>{photos.length} of 6 required</span>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 flex items-start gap-3">
        <Lightbulb className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium mb-1">Not sure which photos to use?</p>
          <button className="text-sm text-primary hover:underline">
            See what works based on research.
          </button>
        </div>
      </div>

      <Sheet open={showSheet} onOpenChange={setShowSheet}>
        <SheetContent side="bottom" className="h-[300px]">
          <SheetHeader>
            <SheetTitle>Pick your videos and photos</SheetTitle>
            <SheetDescription>Choose where to upload from</SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-3">
            <button
              className="w-full py-4 text-center text-lg font-medium border rounded-lg hover:bg-muted transition-colors"
              disabled
            >
              Instagram
            </button>
            <label className="block">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
                disabled={uploading}
              />
              <div className="w-full py-4 text-center text-lg font-medium border rounded-lg hover:bg-muted transition-colors cursor-pointer">
                {uploading ? 'Uploading...' : 'Camera Roll'}
              </div>
            </label>
            <button
              onClick={() => setShowSheet(false)}
              className="w-full py-4 text-center text-lg font-medium border rounded-lg hover:bg-muted transition-colors"
            >
              Cancel
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};
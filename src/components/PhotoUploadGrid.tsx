import { useCallback, useMemo, useRef, useState } from "react";
import { Camera, GripVertical, Lightbulb, Plus, Trash2, X } from "lucide-react";
import imageCompression from "browser-image-compression";
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ImageCropDialog } from "@/components/ImageCropDialog";

const MAX_PHOTOS = 6;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export interface Photo {
  id: string;
  photo_url: string;
  order_index: number;
  is_primary: boolean | null;
}

interface PhotoUploadGridProps {
  userId: string;
  profileId: string;
  photos: Photo[];
  onPhotosUpdate: () => void;
}

interface SortableSlotProps {
  id: string;
  index: number;
  photo: Photo | null;
  uploading: boolean;
  onOpenSheet: (slotIndex: number, photo?: Photo) => void;
  onDelete: (photo: Photo) => void;
}

interface SheetContext {
  slotIndex: number;
  photo?: Photo;
}

const getStoragePath = (url: string) => {
  const parts = url.split("/profile-photos/");
  return parts.length > 1 ? parts[1] : null;
};

const SortableSlot = ({ id, index, photo, uploading, onOpenSheet, onDelete }: SortableSlotProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({
    id,
    disabled: !photo,
    data: {
      slotIndex: index,
      photoId: photo?.id ?? null,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  const handleClick = () => {
    if (uploading) return;
    onOpenSheet(index, photo ?? undefined);
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} className="aspect-square">
      <div
        onClick={handleClick}
        {...(photo ? listeners : {})}
        className={`relative flex h-full w-full items-center justify-center overflow-hidden rounded-[16px] border transition-all ${
          photo ? "border-border bg-muted/10" : "border-dashed border-border bg-muted/30 hover:bg-muted/40"
        } ${isOver && !photo ? "border-primary/70 bg-primary/10" : ""}`}
      >
        {photo ? (
          <>
            <img src={photo.photo_url} alt="Profile" className="h-full w-full object-cover" />
            <div className="absolute inset-0 flex flex-col justify-between bg-black/0 p-3 transition-opacity group-hover:bg-black/30">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onDelete(photo);
                  }}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-all hover:bg-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black group-hover:opacity-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-center justify-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                <div className="rounded-full bg-black/60 p-2 text-white">
                  <GripVertical className="h-4 w-4" />
                </div>
                <span className="rounded-full bg-black/60 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white">
                  Drag to reorder
                </span>
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-muted-foreground">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Camera className="h-6 w-6" />
            </div>
            <div className="text-center text-sm">
              <p className="font-medium">Add photo</p>
              <p className="text-xs text-muted-foreground">Tap to upload</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const PhotoUploadGrid = ({ userId, profileId, photos, onPhotosUpdate }: PhotoUploadGridProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetContext, setSheetContext] = useState<SheetContext | null>(null);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [originalFileName, setOriginalFileName] = useState<string>("");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 120,
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const sortedPhotos = useMemo(
    () => [...photos].sort((a, b) => a.order_index - b.order_index),
    [photos]
  );

  const slots = useMemo(
    () =>
      Array.from({ length: MAX_PHOTOS }, (_, index) => ({
        id: `slot-${index}`,
        index,
        photo: sortedPhotos[index] ?? null,
      })),
    [sortedPhotos]
  );

  const openSheet = (slotIndex: number, photo?: Photo) => {
    if (!photo && sortedPhotos.length >= MAX_PHOTOS) {
      toast({
        title: "All slots filled",
        description: "Remove a photo before uploading a new one.",
        variant: "destructive",
      });
      return;
    }

    setSheetContext({ slotIndex, photo });
    setSheetOpen(true);
  };

  const closeSheet = () => {
    setSheetOpen(false);
    setSheetContext(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const persistOrdering = useCallback(async (ordered: Photo[]) => {
    await Promise.all(
      ordered.map((photo, index) =>
        supabase
          .from("profile_photos")
          .update({
            order_index: index,
            is_primary: index === 0,
          })
          .eq("id", photo.id)
      )
    );
  }, []);

  const removeFromStorage = useCallback(async (photoUrl: string) => {
    const path = getStoragePath(photoUrl);
    if (!path) return;
    await supabase.storage.from("profile-photos").remove([path]);
  }, []);

  const handleDelete = useCallback(
    async (photo: Photo) => {
      try {
        await removeFromStorage(photo.photo_url);
        const { error } = await supabase
          .from("profile_photos")
          .delete()
          .eq("id", photo.id);

        if (error) throw error;

        const remaining = sortedPhotos.filter((item) => item.id !== photo.id);
        if (remaining.length) {
          await persistOrdering(remaining);
        }

        toast({ title: "Photo deleted", description: "Photo removed successfully." });
        closeSheet();
        onPhotosUpdate();
      } catch (error: any) {
        console.error("Delete failed", error);
        toast({
          title: "Delete failed",
          description: error?.message ?? "Unable to delete the photo.",
          variant: "destructive",
        });
      }
    },
    [persistOrdering, removeFromStorage, sortedPhotos, toast, onPhotosUpdate]
  );

  const compressImage = async (file: File) => {
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1080,
      useWebWorker: true,
      fileType: "image/webp",
    };

    try {
      const compressedFile = await imageCompression(file, options);
      return new File([compressedFile], file.name.replace(/\.[^/.]+$/, ".webp"), {
        type: "image/webp",
      });
    } catch (error) {
      console.error("Compression error", error);
      return file;
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !sheetContext) return;

    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast({
        title: "File too large",
        description: "Choose a photo that is 10MB or smaller before compression.",
        variant: "destructive",
      });
      event.target.value = "";
      return;
    }

    // Create a temporary URL for the image to show in the crop dialog
    const imageUrl = URL.createObjectURL(file);
    setImageToCrop(imageUrl);
    setOriginalFileName(file.name);
    setCropDialogOpen(true);
    closeSheet();
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    if (!sheetContext) return;

    setUploading(true);
    setCropDialogOpen(false);

    try {
      // Convert blob to file for compression
      const croppedFile = new File([croppedBlob], originalFileName, { type: "image/webp" });
      const compressedFile = await compressImage(croppedFile);
      const fileName = `${userId}/${Date.now()}.webp`;

      const { error: uploadError } = await supabase.storage
        .from("profile-photos")
        .upload(fileName, compressedFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("profile-photos").getPublicUrl(fileName);

      if (sheetContext.photo) {
        await removeFromStorage(sheetContext.photo.photo_url);
        const { error: updateError } = await supabase
          .from("profile_photos")
          .update({ photo_url: publicUrl })
          .eq("id", sheetContext.photo.id);

        if (updateError) throw updateError;

        toast({ title: "Photo updated", description: "The photo has been replaced." });
      } else {
        const insertIndex = Math.min(sheetContext.slotIndex, sortedPhotos.length);

        const { data, error: insertError } = await supabase
          .from("profile_photos")
          .insert({
            profile_id: profileId,
            photo_url: publicUrl,
            order_index: insertIndex,
            is_primary: sortedPhotos.length === 0 && insertIndex === 0,
          })
          .select("*")
          .single();

        if (insertError) throw insertError;

        const updatedOrder = [...sortedPhotos];
        updatedOrder.splice(insertIndex, 0, data as Photo);
        await persistOrdering(updatedOrder);

        toast({ title: "Photo uploaded", description: "Your photo has been added." });
      }

      onPhotosUpdate();
    } catch (error: any) {
      console.error("Upload error", error);
      toast({
        title: "Upload failed",
        description: error?.message ?? "We couldn't upload that photo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      if (imageToCrop) {
        URL.revokeObjectURL(imageToCrop);
        setImageToCrop(null);
      }
    }
  };

  const handleCropCancel = () => {
    setCropDialogOpen(false);
    if (imageToCrop) {
      URL.revokeObjectURL(imageToCrop);
      setImageToCrop(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const activeSlotIndex = slots.findIndex((slot) => slot.id === active.id);
      const overSlotIndex = slots.findIndex((slot) => slot.id === over.id);
      const activePhoto = slots[activeSlotIndex]?.photo;

      if (!activePhoto) return;

      const ordered = [...sortedPhotos];
      const fromIndex = ordered.findIndex((photo) => photo.id === activePhoto.id);
      if (fromIndex === -1) return;

      const toIndex = Math.min(overSlotIndex, ordered.length - 1);
      const nextOrder = arrayMove(ordered, fromIndex, toIndex);

      try {
        await persistOrdering(nextOrder);
        onPhotosUpdate();
      } catch (error) {
        console.error("Reorder failed", error);
        toast({
          title: "Reorder failed",
          description: "We couldn't reorder the photos. Please try again.",
          variant: "destructive",
        });
      }
    },
    [slots, sortedPhotos, persistOrdering, onPhotosUpdate, toast]
  );

  const handleCameraRoll = () => {
    if (uploading) return;
    if (!sheetContext || (!sheetContext.photo && sortedPhotos.length >= MAX_PHOTOS)) {
      toast({
        title: "All slots filled",
        description: "Remove a photo before uploading a new one.",
        variant: "destructive",
      });
      return;
    }

    fileInputRef.current?.click();
  };

  const filledCount = sortedPhotos.length;
  const currentSheetPhoto = sheetContext?.photo;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 text-lg font-semibold">Pick your videos and photos</h3>
        <p className="text-sm text-muted-foreground">Upload up to six photos to introduce yourself.</p>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={slots.map((slot) => slot.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {slots.map((slot) => (
              <SortableSlot
                key={slot.id}
                id={slot.id}
                index={slot.index}
                photo={slot.photo}
                uploading={uploading}
                onOpenSheet={openSheet}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Tap to edit, drag to reorder</span>
        <span>
          {filledCount} of {MAX_PHOTOS}
        </span>
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4">
        <Lightbulb className="mt-0.5 h-5 w-5 text-primary" />
        <div>
          <p className="mb-1 text-sm font-medium">Not sure which photos to use?</p>
          <button type="button" className="text-sm text-primary underline-offset-4 hover:underline">
            See what works based on research.
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.heic,.HEIC,.heif,.HEIF"
        className="hidden"
        onChange={handleFileSelect}
      />

      <Sheet
        open={sheetOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeSheet();
          } else {
            setSheetOpen(true);
          }
        }}
      >
        <SheetContent side="bottom" className="h-auto pb-8">
          <SheetHeader>
            <SheetTitle>{currentSheetPhoto ? "Edit photo" : "Add a new photo"}</SheetTitle>
            <SheetDescription>
              {currentSheetPhoto
                ? "Replace or remove this photo to refresh your gallery."
                : "Choose where to pull your next photo from."}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-3">
            <Button variant="outline" className="h-12 w-full justify-between" disabled>
              <span>Instagram</span>
              <span className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Coming soon</span>
            </Button>

            <Button onClick={handleCameraRoll} className="h-12 w-full justify-between" disabled={uploading}>
              <span>{uploading ? "Uploading…" : "Camera Roll"}</span>
              <Plus className="h-4 w-4" />
            </Button>

            {currentSheetPhoto && (
              <Button
                variant="outline"
                onClick={() => handleDelete(currentSheetPhoto)}
                className="h-12 w-full justify-between border-destructive/40 text-destructive hover:bg-destructive/10"
              >
                <span>Remove photo</span>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}

            <Button variant="ghost" onClick={closeSheet} className="h-12 w-full">
              Cancel
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {imageToCrop && (
        <ImageCropDialog
          open={cropDialogOpen}
          imageUrl={imageToCrop}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}
    </div>
  );
};

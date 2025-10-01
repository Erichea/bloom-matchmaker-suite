import { useCallback, useEffect, useState } from "react";
import Cropper, { Area, Point } from "react-easy-crop";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ZoomIn } from "lucide-react";

interface ImageCropDialogProps {
  open: boolean;
  imageUrl: string;
  onCropComplete: (croppedBlob: Blob) => void;
  onCancel: () => void;
}

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.src = url;
  });

const getCroppedImg = async (imageSrc: string, pixelCrop: Area): Promise<Blob> => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("No 2d context");
  }

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Canvas is empty"));
        return;
      }
      resolve(blob);
    }, "image/webp");
  });
};

export const ImageCropDialog = ({ open, imageUrl, onCropComplete, onCancel }: ImageCropDialogProps) => {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (open) {
      console.log("ImageCropDialog opened with imageUrl:", imageUrl);
    }
  }, [open, imageUrl]);

  useEffect(() => {
    console.log("croppedAreaPixels updated:", croppedAreaPixels);
  }, [croppedAreaPixels]);

  const onCropChange = (crop: Point) => {
    setCrop(crop);
  };

  const onZoomChange = (zoom: number) => {
    setZoom(zoom);
  };

  const onCropCompleteCallback = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    console.log("Crop complete callback fired:", croppedAreaPixels);
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels) {
      console.error("No crop area available");
      return;
    }

    try {
      setProcessing(true);
      console.log("Cropping image with area:", croppedAreaPixels);
      const croppedBlob = await getCroppedImg(imageUrl, croppedAreaPixels);
      console.log("Cropped blob created:", croppedBlob.size, "bytes");
      onCropComplete(croppedBlob);
    } catch (error) {
      console.error("Error cropping image:", error);
      alert("Failed to crop image: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Position your photo</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="relative h-[400px] w-full overflow-hidden rounded-lg bg-muted" style={{ minHeight: '400px' }}>
            <Cropper
              image={imageUrl}
              crop={crop}
              zoom={zoom}
              aspect={3 / 4}
              onCropChange={onCropChange}
              onZoomChange={onZoomChange}
              onCropComplete={onCropCompleteCallback}
              objectFit="contain"
              style={{
                containerStyle: {
                  width: '100%',
                  height: '100%',
                  position: 'relative'
                }
              }}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm font-medium">
                <ZoomIn className="h-4 w-4" />
                Zoom
              </label>
              <span className="text-sm text-muted-foreground">{Math.round(zoom * 100)}%</span>
            </div>
            <Slider
              min={1}
              max={3}
              step={0.1}
              value={[zoom]}
              onValueChange={(value) => setZoom(value[0])}
              className="w-full"
            />
          </div>

          <p className="text-sm text-muted-foreground">
            Drag to reposition and use the slider to zoom. Your photo will be cropped to a 3:4 ratio.
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel} disabled={processing}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={processing || !croppedAreaPixels}>
            {processing ? "Processing..." : "Save Photo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

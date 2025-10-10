import { useState } from 'react';

export function useUploadFile() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<{ url: string; name: string } | null>(null);
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setUploadingFile(file);
    setProgress(0);

    // Simulate upload progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 100);

    // Create a local URL for the file
    const url = URL.createObjectURL(file);
    
    setTimeout(() => {
      setUploadedFile({ url, name: file.name });
      setIsUploading(false);
      clearInterval(interval);
    }, 1000);
  };

  return {
    isUploading,
    progress,
    uploadedFile,
    uploadingFile,
    uploadFile,
  };
}

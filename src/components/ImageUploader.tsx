import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ImageUploaderProps {
  onImageAnalysis: (analysis: string) => void;
  disabled?: boolean;
}

export function ImageUploader({ onImageAnalysis, disabled }: ImageUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFiles = async (files: FileList) => {
    const file = files[0];
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please upload an image file.",
        variant: "destructive",
      });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      setUploadedImages(prev => [...prev, imageUrl]);
      analyzeImage(imageUrl);
    };
    reader.readAsDataURL(file);
  };

  const analyzeImage = async (imageUrl: string) => {
    setIsProcessing(true);
    try {
      console.log('Analyzing image...');

      const { data, error } = await supabase.functions.invoke('analyze-image', {
        body: { 
          image: imageUrl,
          prompt: 'Identify this landmark or tourist destination. If this is a place someone might want to visit on a tour, provide the name, location (city, country), and brief description.'
        }
      });

      if (error) {
        throw error;
      }

      if (data.success && data.analysis) {
        console.log('Image analysis received:', data.analysis);
        onImageAnalysis(data.analysis);
        
        toast({
          title: "Image Analyzed",
          description: "Your image has been analyzed successfully!",
        });
      } else {
        throw new Error('Failed to analyze image');
      }

    } catch (error) {
      console.error('Error analyzing image:', error);
      toast({
        title: "Analysis Error",
        description: "Failed to analyze your image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-3">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer ${
          dragActive 
            ? 'border-primary bg-primary/5' 
            : 'border-muted hover:border-primary/50'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={!disabled ? openFileDialog : undefined}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          className="hidden"
          disabled={disabled}
        />
        
        <div className="flex flex-col items-center gap-2">
          {isProcessing ? (
            <>
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Analyzing image...</p>
            </>
          ) : (
            <>
              <Upload className="w-8 h-8 text-muted-foreground" />
              <p className="text-sm text-foreground font-medium">
                Drop an image here or click to upload
              </p>
              <p className="text-xs text-muted-foreground">
                Upload photos of places you want to visit
              </p>
            </>
          )}
        </div>
      </div>

      {/* Uploaded Images */}
      {uploadedImages.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {uploadedImages.map((imageUrl, index) => (
            <div key={index} className="relative group">
              <img
                src={imageUrl}
                alt={`Uploaded ${index + 1}`}
                className="w-full h-24 object-cover rounded-lg border"
              />
              <Button
                variant="destructive"
                size="sm"
                className="absolute -top-2 -right-2 w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeImage(index)}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
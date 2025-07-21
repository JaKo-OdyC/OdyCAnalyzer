import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { CloudUpload, FileText, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { UploadedFile } from "@shared/schema";

interface FileUploadProps {
  files: UploadedFile[];
}

export default function FileUpload({ files }: FileUploadProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await apiRequest('POST', '/api/files/upload', formData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/files'] });
      toast({
        title: "File uploaded successfully",
        description: "Your file has been uploaded and is being processed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (fileId: number) => {
      await apiRequest('DELETE', `/api/files/${fileId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/files'] });
      toast({
        title: "File deleted",
        description: "The file has been removed successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setUploading(true);
    
    try {
      for (const file of acceptedFiles) {
        await uploadMutation.mutateAsync(file);
      }
    } catch (error) {
      // Error handling is done in the mutation
    } finally {
      setUploading(false);
    }
  }, [uploadMutation]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/json': ['.json'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    multiple: true,
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) {
      const minutes = Math.floor(diff / (1000 * 60));
      return `${minutes} minutes ago`;
    }
    if (hours < 24) {
      return `${hours} hours ago`;
    }
    const days = Math.floor(hours / 24);
    return `${days} days ago`;
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center">
          <CloudUpload className="text-primary-500 mr-2" size={20} />
          Data Upload
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-primary-500 bg-primary-50'
              : 'border-gray-300 hover:border-primary-500'
          } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <input {...getInputProps()} />
          <CloudUpload className="mx-auto text-4xl text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Upload OdyC Export Files</h3>
          <p className="text-gray-600 mb-4">
            {isDragActive
              ? 'Drop your files here...'
              : 'Drag and drop your JSON, Markdown, or TXT files here, or click to browse'}
          </p>
          <Button
            className="bg-primary-500 text-white hover:bg-primary-600"
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : 'Choose Files'}
          </Button>
          <p className="text-sm text-gray-500 mt-2">Supported formats: JSON, MD, TXT (Max 50MB)</p>
        </div>

        {files.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Recently Uploaded Files</h4>
            <div className="space-y-2">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-md"
                >
                  <div className="flex items-center">
                    <FileText className="text-gray-400 mr-3" size={18} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{file.originalName}</p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.size)} • Uploaded {formatTimeAgo(file.uploadedAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        file.processed
                          ? 'bg-success text-white'
                          : 'bg-warning text-white'
                      }`}
                    >
                      {file.processed ? (
                        <>
                          <Check size={12} className="mr-1" />
                          Processed
                        </>
                      ) : (
                        'Processing...'
                      )}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMutation.mutate(file.id)}
                      disabled={deleteMutation.isPending}
                      className="text-gray-400 hover:text-error"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

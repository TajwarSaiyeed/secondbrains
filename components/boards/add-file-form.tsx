"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, File, ImageIcon, FileText } from "lucide-react";
import { uploadFiles, type UploadFilesResult } from "@/actions/board-content";
export function AddFileForm({ boardId }: { boardId: string }) {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

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
      const newFiles = Array.from(e.dataTransfer.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/"))
      return <ImageIcon className="h-4 w-4" />;
    const name = file.name.toLowerCase();
    if (file.type.includes("pdf") || name.endsWith(".pdf"))
      return <FileText className="h-4 w-4" />;
    if (
      name.endsWith(".doc") ||
      name.endsWith(".docx") ||
      name.endsWith(".txt")
    )
      return <FileText className="h-4 w-4" />;
    if (name.endsWith(".csv") || name.endsWith(".xlsx"))
      return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (
      Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
    );
  };

  async function handleSubmit(formData: FormData) {
    setError("");
    setIsUploading(true);
    files.forEach((file) => formData.append("files", file));
    const res: UploadFilesResult = await uploadFiles(boardId, formData);
    if ("error" in res) {
      setError(res.error);
    } else {
      setFiles([]);
    }
    setIsUploading(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5 text-cyan-600" />
          Upload Files
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragActive
              ? "border-cyan-500 bg-cyan-50 dark:bg-cyan-950/20"
              : "border-gray-300 dark:border-gray-600 hover:border-cyan-400"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Drag and drop files here, or click to select
          </p>
          <form action={handleSubmit} className="inline-block">
            <Label htmlFor="file-upload" className="cursor-pointer">
              <Button type="button" variant="outline" size="sm" asChild>
                <span>Choose Files</span>
              </Button>
            </Label>
            <Input
              id="file-upload"
              type="file"
              name="files"
              multiple
              className="hidden"
              onChange={handleFileSelect}
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.mp4,.mp3,.csv,.xlsx"
            />
          </form>
        </div>

        {files.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Selected Files ({files.length})
            </Label>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-md"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {getFileIcon(file)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <form action={handleSubmit}>
          <Button
            className="w-full bg-cyan-600 hover:bg-cyan-700"
            disabled={files.length === 0 || isUploading}
          >
            {isUploading
              ? "Uploading..."
              : `Upload ${
                  files.length > 0
                    ? `${files.length} File${files.length > 1 ? "s" : ""}`
                    : "Files"
                }`}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

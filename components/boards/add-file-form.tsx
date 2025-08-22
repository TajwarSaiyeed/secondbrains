"use client";

import type React from "react";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Upload,
  X,
  File,
  ImageIcon,
  FileText,
  CheckCircle,
  AlertCircle,
  Clock,
  Loader2,
} from "lucide-react";
import {
  uploadFileWithQueue,
  type FileUploadResult,
} from "@/actions/board-content";

interface QueuedFile {
  file: File;
  id: string;
  status: "waiting" | "uploading" | "processing" | "completed" | "error";
  progress: number;
  error?: string;
}

export function AddFileForm({ boardId }: { boardId: string }) {
  const [dragActive, setDragActive] = useState(false);
  const [queuedFiles, setQueuedFiles] = useState<QueuedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILES = 3; // Limit to 3 files at a time

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
      addFilesToQueue(newFiles);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      addFilesToQueue(newFiles);
    }
  };

  const addFilesToQueue = (newFiles: File[]) => {
    const currentCount = queuedFiles.filter(
      (f) => f.status !== "completed" && f.status !== "error"
    ).length;
    const remainingSlots = MAX_FILES - currentCount;

    if (remainingSlots <= 0) {
      setError(
        `Maximum ${MAX_FILES} files can be uploaded at once. Please wait for current uploads to complete.`
      );
      return;
    }

    const filesToAdd = newFiles.slice(0, remainingSlots);
    const newQueuedFiles: QueuedFile[] = filesToAdd.map((file) => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      status: "waiting",
      progress: 0,
    }));

    setQueuedFiles((prev) => [...prev, ...newQueuedFiles]);
    setError("");

    if (remainingSlots < newFiles.length) {
      setError(
        `Only ${filesToAdd.length} files added. Maximum ${MAX_FILES} files can be uploaded at once.`
      );
    }
  };

  const removeFile = (id: string) => {
    setQueuedFiles((prev) => prev.filter((qf) => qf.id !== id));
  };

  const updateFileStatus = (id: string, updates: Partial<QueuedFile>) => {
    setQueuedFiles((prev) =>
      prev.map((qf) => (qf.id === id ? { ...qf, ...updates } : qf))
    );
  };

  const processQueue = async () => {
    const waitingFiles = queuedFiles.filter((qf) => qf.status === "waiting");
    if (waitingFiles.length === 0) return;

    setIsProcessing(true);

    for (const queuedFile of waitingFiles) {
      try {
        // Update to uploading status
        updateFileStatus(queuedFile.id, { status: "uploading", progress: 25 });

        // Create FormData for this specific file
        const formData = new FormData();
        formData.append("file", queuedFile.file);

        // Call upload action
        updateFileStatus(queuedFile.id, { status: "processing", progress: 75 });
        const result: FileUploadResult = await uploadFileWithQueue(
          boardId,
          formData
        );

        if ("error" in result) {
          updateFileStatus(queuedFile.id, {
            status: "error",
            progress: 0,
            error: result.error,
          });
        } else {
          updateFileStatus(queuedFile.id, {
            status: "completed",
            progress: 100,
          });
        }

        // Small delay between files to show progress
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (err) {
        updateFileStatus(queuedFile.id, {
          status: "error",
          progress: 0,
          error: err instanceof Error ? err.message : "Upload failed",
        });
      }
    }

    setIsProcessing(false);

    // Auto-remove completed files after 3 seconds
    setTimeout(() => {
      setQueuedFiles((prev) => prev.filter((qf) => qf.status !== "completed"));
    }, 3000);
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

  const getStatusIcon = (status: QueuedFile["status"]) => {
    switch (status) {
      case "waiting":
        return <Clock className="h-4 w-4 text-gray-400" />;
      case "uploading":
      case "processing":
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (queuedFile: QueuedFile) => {
    switch (queuedFile.status) {
      case "waiting":
        return "Waiting...";
      case "uploading":
        return "Uploading...";
      case "processing":
        return "Extracting content...";
      case "completed":
        return "Complete!";
      case "error":
        return queuedFile.error || "Error occurred";
      default:
        return "";
    }
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

  const waitingFiles = queuedFiles.filter((qf) => qf.status === "waiting");
  const canUpload = waitingFiles.length > 0 && !isProcessing;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5 text-cyan-600" />
          Upload Files (Max {MAX_FILES} at a time)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950/20 rounded-lg">
            {error}
          </div>
        )}

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
            Drag and drop up to {MAX_FILES} files here, or click to select
          </p>
          <Label htmlFor="file-upload" className="cursor-pointer">
            <Button
              type="button"
              variant="outline"
              size="sm"
              asChild
              disabled={
                queuedFiles.filter(
                  (f) => f.status !== "completed" && f.status !== "error"
                ).length >= MAX_FILES
              }
            >
              <span>Choose Files</span>
            </Button>
          </Label>
          <Input
            ref={fileInputRef}
            id="file-upload"
            type="file"
            name="files"
            multiple
            className="hidden"
            onChange={handleFileSelect}
            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.mp4,.mp3,.csv,.xlsx"
          />
        </div>

        {queuedFiles.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Upload Queue ({queuedFiles.length})
            </Label>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {queuedFiles.map((queuedFile) => (
                <div
                  key={queuedFile.id}
                  className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {getFileIcon(queuedFile.file)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {queuedFile.file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(queuedFile.file.size)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(queuedFile.status)}
                      {queuedFile.status === "waiting" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(queuedFile.id)}
                          className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Progress
                      value={queuedFile.progress}
                      className="flex-1 h-2"
                    />
                    <span className="text-xs text-gray-600 min-w-0">
                      {getStatusText(queuedFile)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Button
          className="w-full bg-cyan-600 hover:bg-cyan-700"
          disabled={!canUpload}
          onClick={processQueue}
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing{" "}
              {
                queuedFiles.filter(
                  (f) => f.status === "uploading" || f.status === "processing"
                ).length
              }{" "}
              files...
            </>
          ) : (
            `Upload ${
              waitingFiles.length > 0
                ? `${waitingFiles.length} File${
                    waitingFiles.length > 1 ? "s" : ""
                  }`
                : "Files"
            }`
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

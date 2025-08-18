"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  Trash2,
  File,
  ImageIcon,
  FileText,
  Video,
  Music,
} from "lucide-react";
import { downloadFile } from "@/actions/board-content";

interface FileCardProps {
  file: {
    id: string;
    name: string;
    size: number;
    type: string;
    uploadedBy: string;
    uploadedAt: string;
  };
  canDelete?: boolean;
}

export function FileCard({ file, canDelete = false }: FileCardProps) {
  async function handleDownload() {
    const res = await downloadFile(file.id);
    if ("error" in res) return;
    const byteCharacters = atob(res.base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const blob = new Blob([new Uint8Array(byteNumbers)], {
      type: res.contentType,
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = res.filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }
  const getFileIcon = (type: string) => {
    if (type.startsWith("image/"))
      return <ImageIcon className="h-5 w-5 text-blue-500" />;
    if (type.includes("pdf") || type.includes("document"))
      return <FileText className="h-5 w-5 text-red-500" />;
    if (type.startsWith("video/"))
      return <Video className="h-5 w-5 text-purple-500" />;
    if (type.startsWith("audio/"))
      return <Music className="h-5 w-5 text-green-500" />;
    return <File className="h-5 w-5 text-gray-500" />;
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

  const getFileTypeLabel = (type: string) => {
    if (type.startsWith("image/")) return "Image";
    if (type.includes("pdf")) return "PDF";
    if (type.includes("document")) return "Document";
    if (type.startsWith("video/")) return "Video";
    if (type.startsWith("audio/")) return "Audio";
    return "File";
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {getFileIcon(file.type)}
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm truncate mb-1">{file.name}</h4>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="text-xs">
                  {getFileTypeLabel(file.type)}
                </Badge>
                <span className="text-xs text-gray-500">
                  {formatFileSize(file.size)}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Uploaded by{" "}
                <span className="font-medium">{file.uploadedBy}</span> •{" "}
                {file.uploadedAt}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-gray-400 hover:text-cyan-600"
              title="Download file"
              onClick={handleDownload}
            >
              <Download className="h-4 w-4" />
            </Button>
            {canDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
                title="Delete file"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AlertTriangle, Trash2 } from "lucide-react";
import { deleteAccount } from "@/actions/settings";

export function DangerZone() {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleDeleteAccount(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("password", password);
    formData.append("confirmation", confirmation);

    const result = await deleteAccount(formData);

    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    }
  }

  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          Danger Zone
        </CardTitle>
        <CardDescription>
          Irreversible and destructive actions. Please proceed with caution.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
            <h4 className="font-medium text-destructive mb-2">
              Delete Account
            </h4>
            <p className="text-sm text-muted-foreground mb-4">
              Once you delete your account, there is no going back. This will
              permanently delete your account, all your boards, and remove you
              from shared boards.
            </p>

            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive" className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  Delete Account
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-destructive">
                    Delete Account
                  </DialogTitle>
                  <DialogDescription>
                    This action cannot be undone. This will permanently delete
                    your account and all associated data.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleDeleteAccount} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="deletePassword">
                      Confirm your password
                    </Label>
                    <Input
                      id="deletePassword"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deleteConfirmation">
                      Type <strong>DELETE</strong> to confirm
                    </Label>
                    <Input
                      id="deleteConfirmation"
                      placeholder="DELETE"
                      value={confirmation}
                      onChange={(e) => setConfirmation(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setOpen(false)}
                      disabled={isLoading}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="destructive"
                      disabled={
                        isLoading || !password || confirmation !== "DELETE"
                      }
                    >
                      {isLoading ? "Deleting..." : "Delete Account"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

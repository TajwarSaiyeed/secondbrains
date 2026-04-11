"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { UserPlus, X, Mail, Copy, Check } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { inviteUsers, generateInvite } from "@/actions/boards";
import { toast } from "sonner";

type InviteLinkResult = { link: string } | { error: string };

type InviteUsersResult = { success: boolean } | { error: string };

export function InviteUsersDialog({
  boardId,
  boardTitle,
}: {
  boardId: string;
  boardTitle?: string;
}) {
  const [open, setOpen] = useState(false);
  const [emails, setEmails] = useState<string[]>([]);
  const [currentEmail, setCurrentEmail] = useState("");
  const [message, setMessage] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");

  const addEmail = () => {
    if (
      currentEmail &&
      isValidEmail(currentEmail) &&
      !emails.includes(currentEmail)
    ) {
      setEmails([...emails, currentEmail]);
      setCurrentEmail("");
    }
  };

  const removeEmail = (emailToRemove: string) => {
    setEmails(emails.filter((email) => email !== emailToRemove));
  };

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addEmail();
    }
  };

  const generateInviteLink = async () => {
    const res: InviteLinkResult = await generateInvite(boardId);
    if ("link" in res) setInviteLink(res.link);
  };

  const handleSend = async () => {
    if (emails.length === 0) return;
    setIsSending(true);
    setError("");
    const res: InviteUsersResult = await inviteUsers(boardId, emails, message);
    if ("error" in res) {
      setError(res.error);
      toast.error(res.error);
    } else {
      setEmails([]);
      setMessage("");
      toast.success("Invitations sent");
      setOpen(false);
    }
    setIsSending(false);
  };

  const copyInviteLink = async () => {
    if (inviteLink) {
      await navigator.clipboard.writeText(inviteLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 bg-transparent dark:border-gray-700 dark:text-white dark:hover:text-gray-700"
        >
          <UserPlus className="h-4 w-4" />
          Invite Users
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Users to Board</DialogTitle>
          <DialogDescription>
            Invite collaborators to join{" "}
            {boardTitle ? `"${boardTitle}"` : "this board"} and start working
            together.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="space-y-2">
            <Label htmlFor="email">Invite by Email</Label>
            <div className="flex gap-2">
              <Input
                id="email"
                type="email"
                placeholder="Enter email address"
                value={currentEmail}
                onChange={(e) => setCurrentEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button
                onClick={addEmail}
                disabled={!currentEmail || !isValidEmail(currentEmail)}
                size="sm"
              >
                Add
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Press Enter or comma to add multiple emails
            </p>
          </div>

          {emails.length > 0 && (
            <div className="space-y-2">
              <Label>Invited Users ({emails.length})</Label>
              <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                {emails.map((email) => (
                  <Badge key={email} variant="secondary" className="gap-1">
                    <Mail className="h-3 w-3" />
                    {email}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeEmail(email)}
                      className="h-4 w-4 p-0 hover:bg-transparent"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="message">Custom Message (Optional)</Label>
            <Textarea
              id="message"
              placeholder="Add a personal message to your invitation..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2 pt-4 border-t">
            <Label>Or Share Invite Link</Label>
            {!inviteLink ? (
              <Button
                variant="outline"
                onClick={generateInviteLink}
                className="w-full gap-2 bg-transparent dark:border-gray-700 dark:text-white dark:hover:text-gray-700"
              >
                <Copy className="h-4 w-4" />
                Generate Invite Link
              </Button>
            ) : (
              <div className="flex gap-2">
                <Input value={inviteLink} readOnly className="flex-1 text-sm" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyInviteLink}
                  className="gap-1 bg-transparent dark:border-gray-700 dark:text-white dark:hover:text-gray-700"
                >
                  {linkCopied ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleSend}
              className="flex-1 bg-cyan-600 hover:bg-cyan-700"
              disabled={emails.length === 0 || isSending}
            >
              {isSending ? "Sending..." : `Send Invitations (${emails.length})`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

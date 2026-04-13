"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { TwoFactorSetup } from "@/components/auth/two-factor-setup";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertTriangle, Loader2 } from "lucide-react";

export function TwoFactorSection() {
  const [setupOpen, setSetupOpen] = useState(false);
  const status = useQuery(api.auth2fa.get2FAStatus, {});

  if (!status) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading 2FA status...
      </div>
    );
  }

  if (status.enabled) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <div>
            <p className="font-medium text-green-600">Enabled</p>
            <p className="text-xs text-gray-600">
              {status.backupCodesRemaining} backup codes remaining
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSetupOpen(true)}
          >
            Regenerate Backup Codes
          </Button>
        </div>

        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            ✅ Your account is protected with two-factor authentication
          </AlertDescription>
        </Alert>

        <TwoFactorSetup
          open={setupOpen}
          onOpenChange={setSetupOpen}
          onSuccess={() => {
            // Refresh status on success
            window.location.reload();
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Alert className="border-yellow-200 bg-yellow-50">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-800">
          ⚠️ Two-factor authentication is not enabled. Enable it to secure your
          account.
        </AlertDescription>
      </Alert>

      <Button
        onClick={() => setSetupOpen(true)}
        className="bg-cyan-600 hover:bg-cyan-700"
      >
        Enable Two-Factor Authentication
      </Button>

      <TwoFactorSetup
        open={setupOpen}
        onOpenChange={setSetupOpen}
        onSuccess={() => {
          // Refresh status on success
          window.location.reload();
        }}
      />
    </div>
  );
}

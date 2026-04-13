'use client'

import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Copy, Check, Shield, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

interface TwoFactorSetupProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function TwoFactorSetup({
  open,
  onOpenChange,
  onSuccess,
}: TwoFactorSetupProps) {
  const [step, setStep] = useState<'intro' | 'qr' | 'verify' | 'backup'>(
    'intro',
  )
  const [totpSecret, setTotpSecret] = useState('')
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [factorId, setFactorId] = useState('')
  const [verifiyCode, setVerifyCode] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)

  const generateSecret = useMutation(api.auth2fa.generateTotpSecret)
  const verifyTwoFA = useMutation(api.auth2fa.verifyAndEnable2FA)

  const handleGenerateSecret = async () => {
    try {
      setLoading(true)
      const result = await generateSecret()

      setTotpSecret(result.secret)
      setQrCodeUrl(result.qrCodeUrl)
      setFactorId(result.factorId)
      setStep('qr')
    } catch (err) {
      toast.error('Failed to generate secret')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCode = async () => {
    if (verifiyCode.length !== 6) {
      toast.error('Please enter a 6-digit code')
      return
    }

    try {
      setLoading(true)
      const result = await verifyTwoFA({
        factorId: factorId as any,
        code: verifiyCode,
      })

      if (result.success) {
        setBackupCodes(result.backupCodes)
        setStep('backup')
        toast.success('2FA enabled successfully!')
      }
    } catch (err) {
      toast.error('Invalid code. Please try again.')
      setVerifyCode('')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyBackupCode = async (code: string) => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Copied to clipboard')
  }

  const handleCompleteSetup = () => {
    onOpenChange(false)
    setStep('intro')
    setTotpSecret('')
    setQrCodeUrl('')
    setVerifyCode('')
    setBackupCodes([])
    onSuccess?.()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-150">
        {step === 'intro' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Enable Two-Factor Authentication
              </DialogTitle>
              <DialogDescription>
                Add an extra layer of security to your account using an
                authenticator app
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Two-factor authentication significantly improves your account
                  security. You'll need an authenticator app to log in.
                </AlertDescription>
              </Alert>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">What you'll need:</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <span className="font-semibold">1.</span>
                      <span>
                        An authenticator app:{' '}
                        <span className="font-mono text-xs">
                          Google Authenticator, Authy, Microsoft Authenticator,
                          etc.
                        </span>
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="font-semibold">2.</span>
                      <span>A smartphone or device with the app installed</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="font-semibold">3.</span>
                      <span>About 2 minutes to complete setup</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleGenerateSecret}
                  disabled={loading}
                  className="bg-cyan-600 hover:bg-cyan-700"
                >
                  {loading ? 'Generating...' : 'Continue'}
                </Button>
              </div>
            </div>
          </>
        )}

        {step === 'qr' && (
          <>
            <DialogHeader>
              <DialogTitle>Scan QR Code</DialogTitle>
              <DialogDescription>
                Use your authenticator app to scan this QR code
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="flex flex-col items-center gap-4">
                {/* In production, generate QR code using 'qrcode' npm package */}
                <div className="rounded border-2 border-dashed border-gray-300 p-4">
                  {/* <QRCode value={qrCodeUrl} size={256} /> */}
                  <div className="flex h-64 w-64 items-center justify-center bg-gray-100 text-sm text-gray-500">
                    QR Code will render here
                    <br />
                    Use qrcode npm package
                  </div>
                </div>

                <div className="text-center">
                  <p className="mb-2 text-sm text-gray-600">
                    Can't scan? Enter this key manually:
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <code className="rounded bg-gray-100 px-4 py-2 font-mono text-sm">
                      {totpSecret}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(totpSecret)
                        setCopied(true)
                        setTimeout(() => setCopied(false), 2000)
                      }}
                    >
                      {copied ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setStep('intro')}>
                  Back
                </Button>
                <Button
                  onClick={() => setStep('verify')}
                  className="bg-cyan-600 hover:bg-cyan-700"
                >
                  I've Scanned the Code
                </Button>
              </div>
            </div>
          </>
        )}

        {step === 'verify' && (
          <>
            <DialogHeader>
              <DialogTitle>Verify Code</DialogTitle>
              <DialogDescription>
                Enter the 6-digit code from your authenticator app
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="flex justify-center gap-2">
                <Input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  value={verifiyCode}
                  onChange={(e) =>
                    setVerifyCode(e.target.value.replace(/\D/g, ''))
                  }
                  className="w-32 text-center font-mono text-2xl tracking-widest"
                  disabled={loading}
                />
              </div>

              <Alert>
                <AlertDescription>
                  The code updates every 30 seconds. Make sure your device time
                  is correct.
                </AlertDescription>
              </Alert>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setStep('qr')}>
                  Back
                </Button>
                <Button
                  onClick={handleVerifyCode}
                  disabled={verifiyCode.length !== 6 || loading}
                  className="bg-cyan-600 hover:bg-cyan-700"
                >
                  {loading ? 'Verifying...' : 'Verify'}
                </Button>
              </div>
            </div>
          </>
        )}

        {step === 'backup' && (
          <>
            <DialogHeader>
              <DialogTitle>Save Backup Codes</DialogTitle>
              <DialogDescription>
                Keep these codes somewhere safe. You'll need them if you lose
                access to your authenticator app.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  ⚠️ Each code can only be used once. Store them in a secure
                  password manager or safe location.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 gap-2">
                {backupCodes.map((code, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 rounded border border-gray-200 bg-gray-50 p-3"
                  >
                    <code className="flex-1 font-mono text-sm">{code}</code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyBackupCode(code)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    const text = backupCodes.join('\n')
                    navigator.clipboard.writeText(text)
                    toast.success('All codes copied!')
                  }}
                  className="flex-1"
                >
                  Copy All
                </Button>
              </div>

              <div className="flex items-center gap-2 rounded border border-green-200 bg-green-50 p-3">
                <input type="checkbox" id="saved" className="rounded" />
                <label htmlFor="saved" className="text-sm text-green-800">
                  I've saved my backup codes in a safe place
                </label>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  onClick={handleCompleteSetup}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Complete Setup
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

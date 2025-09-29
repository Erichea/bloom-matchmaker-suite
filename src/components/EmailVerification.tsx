import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mail, ArrowLeft, Sparkles } from "lucide-react";

interface EmailVerificationProps {
  email: string;
  onVerificationComplete: () => void;
  onBackToSignIn: () => void;
}

export const EmailVerification = ({ email, onVerificationComplete, onBackToSignIn }: EmailVerificationProps) => {
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const { toast } = useToast();

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);

    try {
      console.log('Verifying code:', verificationCode, 'for email:', email);

      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: verificationCode.trim(),
        type: 'signup'
      });

      console.log('Verification response:', { data, error });

      if (error) {
        console.error('Verification error:', error);
        toast({
          title: "Verification Failed",
          description: error.message || "Invalid verification code. Please try again.",
          variant: "destructive",
        });
      } else {
        console.log('Verification successful!', data);
        toast({
          title: "Email Verified! 🎉",
          description: "Welcome to BLOOM! You can now sign in.",
        });
        onVerificationComplete();
      }
    } catch (error: any) {
      console.error('Verification exception:', error);
      toast({
        title: "Verification Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    setIsResending(true);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) {
        toast({
          title: "Failed to Resend",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Code Sent! ✉️",
          description: "A new verification code has been sent to your email.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to resend code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Card className="w-full max-w-md card-premium">
      <CardHeader className="text-center space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-center space-x-2">
            <Mail className="h-5 w-5 text-accent animate-float" />
            <CardTitle className="text-2xl font-light">Verify Your Email</CardTitle>
            <Sparkles className="h-5 w-5 text-accent animate-pulse-soft" />
          </div>
          <div className="w-12 h-0.5 bg-accent mx-auto"></div>
        </div>
        <CardDescription className="text-muted-foreground font-light">
          We've sent a verification code to <span className="font-medium text-foreground">{email}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleVerifyCode} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="verificationCode" className="text-sm font-medium text-muted-foreground">
              Verification Code
            </Label>
            <Input
              id="verificationCode"
              type="text"
              placeholder="Enter 6-digit code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              className="input-premium text-center text-lg tracking-wider"
              maxLength={6}
              required
            />
          </div>

          <Button
            type="submit"
            className="btn-premium w-full"
            disabled={isVerifying || verificationCode.length < 6}
          >
            {isVerifying ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Verifying...
              </div>
            ) : (
              "Verify Email"
            )}
          </Button>
        </form>

        <div className="space-y-3">
          <div className="text-center">
            <Button
              variant="outline"
              onClick={handleResendCode}
              disabled={isResending}
              className="text-sm"
            >
              {isResending ? "Sending..." : "Resend Code"}
            </Button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={onBackToSignIn}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center mx-auto space-x-1"
            >
              <ArrowLeft className="h-3 w-3" />
              <span>Back to Sign In</span>
            </button>
          </div>
        </div>

        <div className="bg-accent/30 border border-accent/20 rounded-lg p-3">
          <p className="text-xs text-center text-muted-foreground">
            Didn't receive the code? Check your spam folder or click "Resend Code" above.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
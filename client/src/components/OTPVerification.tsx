import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, MessageCircle, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface OTPVerificationProps {
  userId: string;
  email: string;
  phone?: string;
  onVerificationComplete: () => void;
}

export default function OTPVerification({ userId, email, phone, onVerificationComplete }: OTPVerificationProps) {
  const [emailOTP, setEmailOTP] = useState("");
  const [phoneOTP, setPhoneOTP] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [phoneSent, setPhoneSent] = useState(false);
  const [displayedPhoneOTP, setDisplayedPhoneOTP] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState({ email: false, phone: false });
  const { toast } = useToast();

  const sendEmailOTP = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/send-email-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        setEmailSent(true);
        toast({
          title: "Email OTP Sent",
          description: "Check your email for the verification code.",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Failed to send email OTP",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send email OTP. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendPhoneOTP = async () => {
    if (!phone) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/auth/send-phone-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        const data = await response.json();
        setPhoneSent(true);
        setDisplayedPhoneOTP(data.otp);
        toast({
          title: "SMS OTP Sent",
          description: "Check your SMS inbox for the verification code.",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Failed to send SMS OTP",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send SMS OTP. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyEmailOTP = async () => {
    if (!emailOTP || emailOTP.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter a 6-digit OTP.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/verify-email-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, otp: emailOTP }),
      });

      if (response.ok) {
        setEmailVerified(true);
        toast({
          title: "Email Verified",
          description: "Your email has been successfully verified.",
        });
        
        // Check if both verifications are complete
        if (phoneVerified || !phone) {
          onVerificationComplete();
        }
      } else {
        const error = await response.json();
        toast({
          title: "Verification Failed",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to verify email OTP. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyPhoneOTP = async () => {
    if (!phoneOTP || phoneOTP.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter a 6-digit OTP.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/verify-phone-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, otp: phoneOTP }),
      });

      if (response.ok) {
        setPhoneVerified(true);
        toast({
          title: "Phone Verified",
          description: "Your phone number has been successfully verified.",
        });
        
        // Check if both verifications are complete
        if (emailVerified) {
          onVerificationComplete();
        }
      } else {
        const error = await response.json();
        toast({
          title: "Verification Failed",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to verify phone OTP. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resendEmailOTP = async () => {
    setResendLoading({ ...resendLoading, email: true });
    try {
      const response = await fetch('/api/auth/resend-email-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        toast({
          title: "Email OTP Resent",
          description: "A new verification code has been sent to your email.",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Failed to resend OTP",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resend email OTP. Please try again.",
        variant: "destructive",
      });
    } finally {
      setResendLoading({ ...resendLoading, email: false });
    }
  };

  const resendPhoneOTP = async () => {
    setResendLoading({ ...resendLoading, phone: true });
    try {
      const response = await fetch('/api/auth/resend-phone-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        toast({
          title: "SMS OTP Resent",
          description: "A new verification code has been sent via SMS.",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Failed to resend OTP",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resend SMS OTP. Please try again.",
        variant: "destructive",
      });
    } finally {
      setResendLoading({ ...resendLoading, phone: false });
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">Verify Your Account</h2>
        <p className="text-muted-foreground">
          We need to verify your email and phone number to complete your registration.
        </p>
      </div>

      {/* Email Verification */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Verification
            {emailVerified && <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Verified</Badge>}
          </CardTitle>
          <CardDescription>
            Verify your email: {email}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!emailSent ? (
            <Button onClick={sendEmailOTP} disabled={loading || emailVerified} className="w-full">
              {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Mail className="h-4 w-4 mr-2" />}
              Send Email OTP
            </Button>
          ) : !emailVerified ? (
            <div className="space-y-3">
              <Input
                type="text"
                placeholder="Enter 6-digit OTP"
                value={emailOTP}
                onChange={(e) => setEmailOTP(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                className="text-center text-lg tracking-widest"
              />
              <div className="flex gap-2">
                <Button onClick={verifyEmailOTP} disabled={loading || emailOTP.length !== 6} className="flex-1">
                  {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Verify Email
                </Button>
                <Button 
                  variant="outline" 
                  onClick={resendEmailOTP} 
                  disabled={resendLoading.email}
                  size="sm"
                >
                  {resendLoading.email ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Resend"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center text-green-600 font-medium">
              <CheckCircle className="h-5 w-5 mr-2" />
              Email verified successfully!
            </div>
          )}
        </CardContent>
      </Card>

      {/* Phone Verification */}
      {phone && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Phone (SMS) Verification
              {phoneVerified && <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Verified</Badge>}
            </CardTitle>
            <CardDescription>
              Verify your phone: {phone}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!phoneSent ? (
              <Button onClick={sendPhoneOTP} disabled={loading || phoneVerified} className="w-full">
                {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <MessageCircle className="h-4 w-4 mr-2" />}
                Send SMS OTP
              </Button>
            ) : !phoneVerified ? (
              <div className="space-y-3">
                <Input
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={phoneOTP}
                  onChange={(e) => setPhoneOTP(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  className="text-center text-lg tracking-widest"
                />
                {displayedPhoneOTP && (
                  <p className="text-center text-sm text-gray-500">
                    Your OTP is: {displayedPhoneOTP}
                  </p>
                )}
                <div className="flex gap-2">
                  <Button onClick={verifyPhoneOTP} disabled={loading || phoneOTP.length !== 6} className="flex-1">
                    {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : null}
                    Verify Phone
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={resendPhoneOTP} 
                    disabled={resendLoading.phone}
                    size="sm"
                  >
                    {resendLoading.phone ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Resend"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center text-green-600 font-medium">
                <CheckCircle className="h-5 w-5 mr-2" />
                Phone verified successfully!
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Progress Indicator */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              {emailVerified ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-500" />
              )}
              <span className={emailVerified ? "text-green-600 font-medium" : "text-muted-foreground"}>
                Email
              </span>
            </div>
            
            {phone && (
              <>
                <div className="w-8 h-0.5 bg-border"></div>
                <div className="flex items-center gap-2">
                  {phoneVerified ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                  )}
                  <span className={phoneVerified ? "text-green-600 font-medium" : "text-muted-foreground"}>
                    Phone
                  </span>
                </div>
              </>
            )}
          </div>
          
          {(emailVerified && (phoneVerified || !phone)) && (
            <div className="text-center mt-4">
              <Badge variant="default" className="bg-green-500">
                <CheckCircle className="h-3 w-3 mr-1" />
                Account Fully Verified
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

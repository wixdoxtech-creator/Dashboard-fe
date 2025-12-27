import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Shield, Smartphone, Mail } from "lucide-react";
import { useState } from "react";
import { customToast } from "@/lib/toastConfig";

const SecuritySettingsCard = () => {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [loginAlerts, setLoginAlerts] = useState(true);

  const handleTwoFactorToggle = (enabled: boolean) => {
    setTwoFactorEnabled(enabled);
    customToast.success(
      enabled
        ? "Two-Factor Authentication has been enabled for your account."
        : "Two-Factor Authentication has been disabled."
    );
  };

  const handleEmailNotificationsToggle = (enabled: boolean) => {
    setEmailNotifications(enabled);
    customToast.info(
      enabled
        ? "Email notifications have been turned ON."
        : "Email notifications have been turned OFF."
    );
  };

  const handleLoginAlertsToggle = (enabled: boolean) => {
    setLoginAlerts(enabled);
    customToast.warning(
      enabled
        ? "Login alerts are now enabled for new device logins."
        : "Login alerts have been disabled."
    );
  };

  return (
    <Card className="shadow-sm py-4">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-xl text-gray-500">
          <Shield className="h-5 w-5" />
          Security Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Two-Factor Authentication */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="two-factor" className="font-medium text-gray-700">
                Two-Factor Authentication
              </Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Add an extra layer of security to your account
            </p>
          </div>
          <Switch
            id="two-factor"
            checked={twoFactorEnabled}
            onCheckedChange={handleTwoFactorToggle}
          />
        </div>

        {/* Email Notifications */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="email-notifications" className="font-medium text-gray-700">
                Email Notifications
              </Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Receive security alerts via email
            </p>
          </div>
          <Switch
            id="email-notifications"
            checked={emailNotifications}
            onCheckedChange={handleEmailNotificationsToggle}
          />
        </div>

        {/* Login Alerts */}
        <div className="flex items-center justify-between py-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="login-alerts" className="font-medium text-gray-700">
                Login Alerts
              </Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Get notified of new device logins
            </p>
          </div>
          <Switch
            id="login-alerts"
            checked={loginAlerts}
            onCheckedChange={handleLoginAlertsToggle}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default SecuritySettingsCard;

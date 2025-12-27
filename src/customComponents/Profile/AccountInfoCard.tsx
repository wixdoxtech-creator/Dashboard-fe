import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Calendar } from "lucide-react";

interface AccountInfoCardProps {
  userDetails: {
    name?: string;
    email?: string;
    phone?: string;
  };
  licenseDetails: {
    planId?: number;
    planStartAt?: string;
  };
}

const AccountInfoCard = ({
 
  licenseDetails,
}: AccountInfoCardProps) => {
  const { planStartAt } = licenseDetails || {};

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  // const accountType = planId ? "Premium" : "Free Trial";
  // const badgeClass =
  //   planId
  //     ? "bg-yellow-100 text-yellow-700 border-yellow-300"
  //     : "bg-blue-100 text-blue-700 border-blue-300";

  return (
    <Card className="shadow-sm py-6">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-gray-500 gap-2 text-xl">
          <User className="h-5 w-5" />
          Account Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Member Since */}
          <div>
            <label className="text-lg text-muted-foreground">Member Since:</label>
            <div className="mt-1 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-primary">
                {formatDate(planStartAt)}
              </span>
            </div>
          </div>

          {/* Account Type */}
          {/* <div>
            <label className="text-lg text-muted-foreground">Account Type:</label>
            <div className="mt-1">
              <Badge variant="outline" className={`${badgeClass} inline-flex items-center text-md`}>
                <Crown className="h-3 w-3 mr-1" />
                {accountType}
              </Badge>
            </div>
          </div> */}
        </div>
      </CardContent>
    </Card>
  );
};

export default AccountInfoCard;

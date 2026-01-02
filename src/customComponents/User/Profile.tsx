import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  User,
  CreditCard,
  Shield,
  Clock,
  CheckCircle,
  AlertCircle,
  Mail,
  Phone,
  MapPin
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const ProfileCard = () => {
  const { user: authUser } = useAuth();
  const userEmail = authUser?.email;

  const [userDetails, setUserDetails] = useState<any>(null);
  const [licenseDetails, setLicenseDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-200 text-green-900">
            <CheckCircle className="w-3 h-3 mr-1" />Active
          </Badge>
        );
      case "expired":
        return (
          <Badge variant="destructive">
            <AlertCircle className="w-3 h-3 mr-1" />Expired
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-300 text-yellow-600">
            <Clock className="w-3 h-3 mr-1" />Pending
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  useEffect(() => {
    if (!userEmail) return;

    const fetchUserDetails = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/user/get-by-email/${userEmail}`);
        const data = await res.json();
        setUserDetails(data);
      } catch (err) {
        console.error("Failed to fetch user details:", err);
      }
    };

    const fetchLicenseDetails = async () => {
      // console.log("test");
      try {
        const res = await fetch(`${API_BASE_URL}/user/license/email/${userEmail}`);
        
        const data = await res.json();
        // console.log(data);
        setLicenseDetails(data);
      } catch (err) {
        console.error("Failed to fetch license details:", err);
      }
    };
    

    const fetchAll = async () => {
      await Promise.all([fetchUserDetails(), fetchLicenseDetails()]);
      setLoading(false);
    };

    fetchAll();
  }, [userEmail]);


  if (loading || !userDetails) return <div>Loading...</div>;

  const {
    name,
    surname,
    email,
    phone,
    country,
    state,
    pin_code,
    address,
  } = userDetails;

  const {
    licenseId,
    planId,
    imei,
    planName,
    planStartAt,
    planExpireAt,
    price,
    paymentId,
    paymentMethod
  } = licenseDetails || {};

  const licenseStatus = planExpireAt
    ? new Date(planExpireAt) < new Date()
      ? "expired"
      : "active"
    : "pending";

  return (
    <Card className="w-full max-w-2xl py-8 mx-auto shadow-lg border-border/50 bg-gradient-to-br from-card to-secondary/30 ">
      <CardHeader className="pb-6">
        <div className="flex items-center space-x-4">
          <Avatar className="w-20 h-20 ring-2 ring-primary/20">
            <AvatarImage
              src={"https://cdn.pixabay.com/photo/2019/08/11/18/59/icon-4399701_960_720.png"}
              alt={name}
            />
            <AvatarFallback className="text-lg font-semibold bg-primary text-primary-foreground">
              {name?.split(" ").map((n: string) => n[0]).join("")}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">{`${name} ${surname}`}</h2>
              {getStatusBadge(licenseStatus)}
            </div>
            <div className="space-y-1 text-muted-foreground">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <span className="text-sm">{email}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4" />
                <span className="text-sm">{phone}</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">
                  {address}, {state}, {country} - {pin_code}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Subscription Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-foreground">
              <Shield className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-xl text-gray-600">Subscription Details</h3>
            </div>
            <div className="space-y-3 pl-7">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Plan:</span>
                <Badge variant="outline" className="font-medium text-blue-600 bg-blue-100">
                  {planName || "No Plan"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duration:</span>
                <span className="font-medium text-gray-600">{planId ? "28 Days" : "Trial"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">License ID:</span>
                <span className="font-mono text-sm bg-muted px-2 py-1 rounded text-gray-600">
                  {licenseId || "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Start Date:</span>
                <span className="font-medium text-gray-600">{formatDate(planStartAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Expiry Date:</span>
                <span className="font-medium text-red-600">{formatDate(planExpireAt)}</span>
              </div>
            </div>
          </div>

          {/* Payment Section */}
          {licenseDetails && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-foreground">
              <CreditCard className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-xl text-gray-600">Payment Information</h3>
            </div>
            <div className="space-y-3 pl-7">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Method:</span>
                <span className="font-medium text-gray-600">
                  {paymentMethod || "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-medium text-green-600">
                  {price ? `₹${price}` : "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment ID:</span>
                <span className="font-medium text-gray-600">{paymentId || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Device IMEI:</span>
                <span className="font-medium text-gray-600">{imei || "N/A"}</span>
              </div>
            </div>
          </div>
           )}
        </div>
         

        {/* Account Info */}
        <div className="border-t border-border/50 pt-4 ">
          <div className="flex items-center space-x-2 text-foreground mb-4">
            <User className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-xl text-gray-600">Account Information</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pl-7">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Member Since:</span>
              <span className="font-medium text-gray-600">{formatDate(planStartAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Account Type:</span>
              <span className="font-medium text-blue-600">
                {planId ? "Premium" : "Free Trial"}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

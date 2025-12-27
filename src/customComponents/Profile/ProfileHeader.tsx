import { Badge } from "@/components/ui/badge";
import { Mail, Phone, MapPin } from "lucide-react";

const ProfileHeader = ({ userDetails, licenseStatus }: { userDetails: any, licenseStatus: string }) => {
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

    return (
        <div className="bg-gray-100 border-b border-border rounded-lg p-4 sm:p-6 lg:p-8">

            {/* Profile Section */}
            <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24   mx-auto sm:mx-0">
                    <img
                        src={"person.png"}
                        alt={name}
                    />
                </div>

                <div className="flex-1 w-full text-center sm:text-left">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3 sm:mb-2">
                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-gray-700 break-words">
                            {`${name} ${surname}`}
                        </h2>
                        <Badge variant="outline" className="text-sm sm:text-base lg:text-lg bg-green-200 text-green-600 border-green-400/20 w-fit mx-auto sm:mx-0">
                            <span>Status: {licenseStatus}</span>
                        </Badge>
                    </div>

                    <div className="space-y-2 sm:space-y-1 text-sm sm:text-base lg:text-lg text-muted-foreground">
                        <div className="flex items-center justify-center sm:justify-start gap-2">
                            <Mail className="h-4 w-4 flex-shrink-0" />
                            <span className="break-all sm:break-normal">{email}</span>
                        </div>
                        <div className="flex items-center justify-center sm:justify-start gap-2">
                            <Phone className="h-4 w-4 flex-shrink-0" />
                            <span className="break-all sm:break-normal">{phone}</span>
                        </div>
                        <div className="flex items-center justify-center sm:justify-start gap-2">
                            <MapPin className="h-4 w-4 flex-shrink-0" />
                            <span className="text-xs sm:text-sm break-words">
                                {address}, {state}, {country} - {pin_code}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileHeader;
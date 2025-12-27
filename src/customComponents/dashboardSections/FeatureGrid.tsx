import { motion } from 'framer-motion';
import {
  Phone, Mail,  MapPin, Target, Image, Camera, Chrome,
  Users, AppWindowIcon, PhoneCall, MessageCircle,
  LocateFixedIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  bgColor: string;
  path: string;
  iconColor?: string;
}

const FeatureCard = ({
  icon: Icon,
  title,
  bgColor,
  iconColor = 'text-current',
  path,
}: FeatureCardProps) => {
  const navigate = useNavigate();

  return (
    <motion.div
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      className={`relative group p-5 rounded-lg overflow-hidden backdrop-blur-md transition-all duration-100 cursor-pointer ${bgColor}`}
      onClick={() => navigate(path)} // Navigate to path on click
    >
      <div className="absolute inset-0 border border-transparent rounded-2xl group-hover:border-white/20 group-hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] pointer-events-none"></div>
      <div className="flex items-center gap-3 relative z-10">
        <div className="p-2 rounded-lg bg-white/30 backdrop-blur-sm shadow-inner">
          <Icon size={24} className={iconColor} />
        </div>
        <h3 className="hidden md:block text-md font-semibold text-black/80 group-hover:text-black transition-colors duration-100">
          {title}
        </h3>
      </div>
    </motion.div>
  );
};

interface FeatureGridProps {
  isSidebarOpen: boolean;
}

export const FeatureGrid = ({ isSidebarOpen }: FeatureGridProps) => {
  const features = [
    { icon: Phone, title: 'Call Recordings', path: "/call-recording" },
    { icon: Mail, title: 'SMS', path: '/sms' },
    { icon: MessageCircle, title: 'WhatsApp', path: '/whatsapp' },
    { icon: MapPin, title: 'Location History', path: '/location-history' },
    { icon: Target, title: 'Live Stream', path: '/live-stream' },
    { icon: Image, title: 'Photos', path: '/photos' },
    { icon: Camera, title: 'Instagram', path: '/instagram' },
    { icon: PhoneCall, title: 'Call History', path: '/call-history' },
    { icon: Users, title: 'Contacts', path: '/contacts' },
    { icon: LocateFixedIcon, title: 'IP-Address', path: '/ip-address' },
    { icon: AppWindowIcon, title: 'Application', path: '/applications' },
    { icon: Chrome, title: 'Internet History', path: '/internet-history' },
  ];

  return (
    <div className={`grid grid-cols-3 gap-4 bg-slate-50 rounded-lg shadow relative p-4 ${isSidebarOpen ? 'py-12.5' : 'py-11'}`}>
      {features.map((feature, index) => (
        <motion.div
          key={feature.path}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, delay: index * 0.05 }}
        >
          <FeatureCard
            icon={feature.icon}
            title={feature.title}
            path={feature.path}
            bgColor="bg-gradient-to-br from-cyan-100 to-cyan-200 text-cyan-800"
            // onClick={() => setActiveComponent(feature.componentId)}
          />
        </motion.div>
      ))}
    </div>
  );
};

import React, { useState } from 'react';
import { User, Lock, Key, DollarSign } from 'lucide-react';

function UserProfile() {
  const [basicInfo, setBasicInfo] = useState({
    name: 'user',
    email: 'user@example.com',
    deviceName: ''
  });

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorForm, setTwoFactorForm] = useState({
    email: '',
    otp: ''
  });

  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleBasicInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle basic info submission
  };

  const handleTwoFactorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle 2FA submission
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle password change
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6">
            <User className="w-6 h-6 text-blue-500" />
            <h2 className="text-xl font-semibold">Basic Information</h2>
          </div>
          <form onSubmit={handleBasicInfoSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={basicInfo.name}
                  onChange={(e) => setBasicInfo({...basicInfo, name: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg bg-gray-100 border-transparent focus:border-[#B27B60] focus:ring-0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={basicInfo.email}
                  onChange={(e) => setBasicInfo({...basicInfo, email: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg bg-gray-100 border-transparent focus:border-[#B27B60] focus:ring-0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Device Name</label>
                <input
                  type="text"
                  placeholder="Enter any device name"
                  value={basicInfo.deviceName}
                  onChange={(e) => setBasicInfo({...basicInfo, deviceName: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg bg-gray-100 border-transparent focus:border-[#B27B60] focus:ring-0"
                />
              </div>
              <div className='flex justify-center'>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-400 w-80 text-white rounded-full hover:bg-blue-500 cursor-pointer transition-colors"
              >
                Submit
              </button>
              </div>
            </div>
          </form>
        </div>

        {/* 2FA Settings */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6">
            <Lock className="w-6 h-6 text-blue-500" />
            <h2 className="text-xl font-semibold">OTP/2-Factor Authentication</h2>
          </div>
          <form onSubmit={handleTwoFactorSubmit}>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={twoFactorEnabled}
                  onChange={(e) => setTwoFactorEnabled(e.target.checked)}
                  className="rounded text-[#B27B60] focus:ring-[#B27B60]"
                />
                <label className="text-sm font-medium text-gray-700">Enable</label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={twoFactorForm.email}
                  onChange={(e) => setTwoFactorForm({...twoFactorForm, email: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg bg-gray-100 border-transparent focus:border-[#B27B60] focus:ring-0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">OTP</label>
                <input
                  type="text"
                  value={twoFactorForm.otp}
                  onChange={(e) => setTwoFactorForm({...twoFactorForm, otp: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg bg-gray-100 border-transparent focus:border-[#B27B60] focus:ring-0"
                />
              </div>
              <div>
                <button
                  type="button"
                  className="text-blue-500 text-md hover:underline"
                  onClick={() => {/* Handle OTP request */}}
                >
                  Request OTP
                </button>
              </div>
              <div className='flex justify-center'>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-400 w-80 text-white rounded-full hover:bg-blue-500 cursor-pointer transition-colors"
              >
                Submit
              </button>
               </div>
            </div>
          </form>
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6">
            <Key className="w-6 h-6 text-blue-500" />
            <h2 className="text-xl font-semibold">Change Password</h2>
          </div>
          <form onSubmit={handlePasswordSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Old Password</label>
                <input
                  type="password"
                  value={passwordForm.oldPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, oldPassword: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg bg-gray-100 border-transparent focus:border-[#B27B60] focus:ring-0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg bg-gray-100 border-transparent focus:border-[#B27B60] focus:ring-0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg bg-gray-100 border-transparent focus:border-[#B27B60] focus:ring-0"
                />
              </div>
              <div className='flex justify-center'>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-400 w-80  text-white rounded-full hover:bg-blue-500 transition-colors"
              >
                Submit
              </button>
                </div>
            </div>
          </form>
        </div>

        {/* Payment History */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6">
            <DollarSign className="w-6 h-6 text-yellow-400" />
            <h2 className="text-xl font-semibold">Payment History</h2>
          </div>
          <div className="flex items-center justify-center h-40 text-gray-500">
            No Payment history found.
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserProfile;
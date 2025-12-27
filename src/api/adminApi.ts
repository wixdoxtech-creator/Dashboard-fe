// src/api/adminApi.ts
import axios from 'axios';

type AdminRegisterResponse = {
  success: boolean;
  message?: string;
  token?: string;
};

type AdminAuthResponse = {
  success: boolean;
  message?: string;
  token?: string; // JWT token for authenticated requests
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const adminRegister = async (
  email: string,
  password: string
): Promise<AdminRegisterResponse> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/admin/register`, {
      email,
      password,
    });
    
    // Check if the response indicates success
    if (response.data && response.status === 201) {
      return {
        success: true,
        message: "Registration successful",
        token: response.data.token
      };
    } else {
      return {
        success: false,
        message: response.data?.message || "Registration failed"
      };
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // Log the full error response for debugging
      console.error("Registration error:", error.response?.data);
      
      return {
        success: false,
        message: error.response?.data?.message || "Registration failed",
      };
    }
    return { success: false, message: "Unknown error" };
  }
};

// Admin Login
export const adminLogin = async (
  email: string,
  password: string
): Promise<AdminAuthResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/login`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Login failed");
    }

    return await response.json();
  } catch (error) {
    console.error("Login error:", error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : "Network error" 
    };
  }
};
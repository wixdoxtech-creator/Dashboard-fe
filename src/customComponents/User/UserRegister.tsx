import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthCard } from "@/components/auth/AuthCard";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { userRegister } from "@/api/userApi";

const registerSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters." }),
  email: z
    .string()
    .email({ message: "Please enter a valid email address." }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters." })
    // .regex(/[A-Z]/, { message: "Password must contain an uppercase letter." })
    .regex(/[a-z]/, { message: "Password must contain a lowercase letter." })
    .regex(/[0-9]/, { message: "Password must contain a number." }),
  terms: z
    .boolean()
    .refine((val) => val === true, { message: "You must accept the terms and conditions." }),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function UserRegister() {
  const navigate = useNavigate();
  
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      terms: false,
    },
  });

  async function onSubmit(data: RegisterFormValues) {
    try {
      const response = await userRegister(data.name, data.email, data.password);
      
      console.log("API Response:", response);
      
      // If we get a token and user object, it means registration was successful
      if (response.token && response.user) {
        toast.success("Account created successfully!");
        
        // Navigate to login page
        navigate("/userlogin");
      } else if (response.message?.toLowerCase().includes("already exists")) {
        // Handle already exists error
        toast.error("A user with this email already exists. Please try a different email.");
      } else {
        // Generic error
        toast.error(response.message || "Registration failed.");
      }
    } catch (err) {
      console.error("Registration error:", err);
      toast.error("An error occurred. Please try again.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted">
      <div className="w-full max-w-md">
        <AuthCard
          headerContent={
            <>
              <div className="flex justify-center mb-2">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                  </svg>
                </div>
              </div>
              <h1 className="text-2xl font-bold text-center">Create an account</h1>
              <p className="text-sm text-muted-foreground text-center">Enter your information to get started</p>
            </>
          }
        >
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" autoComplete="name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="name@example.com" type="email" autoComplete="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <PasswordInput placeholder="••••••••" autoComplete="new-password" {...field} />
                    </FormControl>
                    <div className="text-xs text-muted-foreground mt-1">
                      Password must be at least 8 characters and include uppercase, lowercase, and numbers.
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="terms"
                render={({ field }) => (
                  <FormItem className="flex items-start space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="leading-tight">
                      <FormLabel className="text-sm font-normal">
                        I agree to the{" "}
                        <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link> and{" "}
                        <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
                      </FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                Create account
              </Button>

              <div className="text-center text-sm">
                Already have an account?{" "}
                <Link to="/userlogin" className="text-primary font-medium hover:underline">Sign in</Link>
              </div>
            </form>
          </Form>
        </AuthCard>
      </div>
    </div>
  );
}

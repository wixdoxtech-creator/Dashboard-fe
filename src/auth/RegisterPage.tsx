import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import RegisterForm from './components/RegisterForm';
import { Link } from 'react-router-dom';

const RegisterPage = () => {
  return (
    <div className="relative min-h-screen flex items-center justify-center  bg-cover bg-center">
      {/* Main Content */}
      <main className="flex-1 flex flex-col md:flex-row py-6 px-4 container max-w-7xl mx-auto">
        {/* Left Side with Image */}
        <div className="w-full md:w-1/2 flex justify-center items-center mb-6 md:mb-0 md:pr-10">
          <img
            src="/signupbg011.png"
            alt="sign up image"
            className="w-full h-auto lg:h-183 max-h-80 md:max-h-none rounded-xl object-cover"
          />
        </div> 

        {/* Right Side with Form */}
        <div className="w-full md:w-1/2 flex justify-center items-center">
          <Card className="w-full max-w-xl mx-auto shadow-none border border-gray-200 bg-white py-6 rounded-lg">

            <CardHeader className="text-center">
              <CardTitle className="text-4xl font-semibold text-gray-700">Create Account</CardTitle>
              <CardDescription className='text-sm mb-4'>
                Register to access the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RegisterForm />
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <div className="text-md text-center text-muted-foreground">
                <p>
                  Already have an account?{' '}
                  <Link to="/user/login" className="text-legal hover:underline">Login</Link>
                </p>
              </div>
            </CardFooter>
          </Card>
        </div>
      </main>
      
      </div>
  );
};

export default RegisterPage;

// import  { useState  } from "react";
// import axios from "axios";

// const BASE_URL = process.env.VITE_API_BASE_URL; 

// const SelectPlan = () => {
//   type License = {
//     id: string;
//     package: string;
//     expiry: string;
//     // add other properties if needed
//   };
//   const [licenses, setLicenses] = useState<License[]>([]);


 
//   const [email, setEmail] = useState("");
//   const [loading, setLoading] = useState(false);

//   // Fetch plans on mount
//   const plans = [
//     { id: 1, name: "Basic" },
//     { id: 2, name: "Standard" },
//     { id: 3, name: "Premium" },
//   ];

//   // Fetch licenses for given email
//   const fetchLicenses = async () => {
//     setLoading(true);
//     try {
//       const response = await axios.post(`${BASE_URL}/user/license/select-plan`, {
//         entity: "licenses",
//         email,
//         password: "123456",     // adjust or prompt securely
//         imei: "40025239591905D8",     // any value to trigger license creation
//       });
//       setLicenses(response.data);
//     } catch (error) {
//       console.error("Failed to fetch licenses:", error);
//       alert("No licenses found or error occurred");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Assign a plan to the licenseId
//   const assignPlan = async (licenseId: string, planId: string | number) => {
//     try {
//       const response = await axios.post(`${BASE_URL}/user/license/select-plan`, {
//         licenseId: String(licenseId),
//         planId: planId,
//       });
//       alert(response.data.message);
//       fetchLicenses(); // refresh licenses
//     } catch (error) {
//       console.error("Failed to assign plan:", error);
//       alert("Failed to assign plan");
//     }
//   };

//   return (
//     <div className="max-w-xl mx-auto p-4">
//       <h1 className="text-xl font-bold mb-4">🎯 Assign Plan to License</h1>

//       <input
//         type="email"
//         value={email}
//         onChange={(e) => setEmail(e.target.value)}
//         className="border border-gray-300 px-3 py-2 rounded w-full mb-2"
//         placeholder="Enter your email"
//       />

//       <button
//         onClick={fetchLicenses}
//         className="bg-blue-600 text-white px-4 py-2 rounded mb-4"
//         disabled={loading}
//       >
//         {loading ? "Loading..." : "Fetch Licenses"}
//       </button>

//       {licenses.map((lic) => (
//         <div key={lic.id} className="border p-3 rounded mb-4">
//           <p><strong>License ID:</strong> {lic.id}</p>
//           <p><strong>Current Plan:</strong> {lic.package}</p>
//           <p><strong>Expiry:</strong> {lic.expiry}</p>

//           <div className="mt-2">
//             <label className="block font-medium mb-1">Assign Plan:</label>
//             <div className="flex gap-2 flex-wrap">
//               {plans.map((plan) => (
//                 <button
//                   key={plan.id}
//                   onClick={() => assignPlan(lic.id, plan.id)}
//                   className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
//                 >
//                   {plan.name}
//                 </button>
//               ))}
//             </div>
//           </div>
//         </div>
//       ))}
//     </div>
//   );
// };

// export default SelectPlan;

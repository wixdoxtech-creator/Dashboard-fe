import { useState } from "react";

export function DisclaimerSection() {
  const [expanded, setExpanded] = useState(false);

  const fullText = `Ion Monitor This application is designed solely for lawful and
  authorized use. By using this app, you agree that it will only be
  installed on devices for which you have full legal ownership or
  explicit consent from the user of the device. Unauthorized monitoring
  or surveillance of individuals without their knowledge and permission
  may violate local, state, federal, or international laws. It is your
  sole responsibility to ensure that your use of this app complies with
  all applicable laws and regulations. The developers, distributors, and
  affiliates of this application are not liable for any misuse of the
  software or any consequences arising from unauthorized surveillance or
  data collection. By proceeding with the installation or use of this
  app, you acknowledge and agree to use it ethically and lawfully. If
  you do not have legal authority or consent, you must not use this
  application. This app is intended only for lawful use. You may only
  install or use it on devices you own or have explicit legal permission
  to monitor. Unauthorized surveillance is illegal in many jurisdictions
  and may lead to criminal charges or civil penalties. By continuing,
  you confirm that you have the legal right to use this app and take
  full responsibility for its use. The developers and distributors of
  this app are not liable for any misuse. If you do not have proper
  authorization, do not use this app.`;

  const shortText = fullText.split(" ").slice(0, 60).join(" ");

  return (
    <div className="bg-gray-100 p-4 rounded-lg border border-gray-200 mx-auto my-10">
      <h2 className="text-2xl font-bold text-gray-500 mb-4 flex justify-center items-center">
        Disclaimer
      </h2>

      <div className="space-y-4 text-gray-700 text-sm leading-relaxed text-justify">
        <p>
          {expanded ? fullText : shortText + "... "}
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-indigo-600 hover:text-indigo-800 font-medium inline cursor-pointer"
          >
            {expanded ? "See Less" : "See More"}
          </button>
        </p>

        <p className="font-medium text-gray-600 mt-4 flex justify-center items-center">
          Ion Monitor © 2025. All rights reserved.
        </p>
      </div>
    </div>
  );
}

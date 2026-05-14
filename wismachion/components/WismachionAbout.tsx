import { Building2, CheckCircle, Cpu, Settings, History, Award } from 'lucide-react';

export function WismachionAbout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <Building2 className="w-20 h-20" />
            </div>
            <h1 className="text-5xl font-bold mb-4">About Wismachion</h1>
            <p className="text-2xl text-blue-100 mb-6">智訊科技 - Industrial Communication & Automation Solutions</p>
            <p className="text-lg text-white/90 max-w-3xl mx-auto leading-relaxed">
              Specializing in RS-232 Communication Protocol Development & Industrial Automation Software
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Mission Statement */}
        <div className="bg-white rounded-2xl shadow-lg p-10 mb-16">
          <div className="flex items-center gap-3 mb-6">
            <Cpu className="w-10 h-10 text-blue-600" />
            <h2 className="text-4xl font-bold text-gray-900">Our Mission</h2>
          </div>
          <div className="space-y-4 text-lg text-gray-700 leading-relaxed">
            <p>
              成立一家軟體公司一直是本人戮力以赴的目標，而今已開發完成 <strong>PerfetComm RS232 Communication Protocol Development & Special Testing Software</strong>，是本人的一小步，相信對許多工程師來說，會是很有幫助的一個軟體。
            </p>
            <p>
              在 RS232/422/485 領域，在通訊協議軟體開發測試領域，在 USB 轉 Wifi、BlueTooth、UHF 等傳輸來說會是一個助力很大的一個軟體。很多設備皆使用 RS232 當電腦與通訊的接口，因此有一個 RS232 通訊 Protocol 的測試與研發，或做 RS485 群/分控，Console Port 的控制等等領域是很有幫助的一個通訊軟體。簡便、易用、可任意創作。
            </p>
            <p className="text-xl font-semibold text-blue-700 mt-6">
              This RS-232 Communication software provides you development communication protocol or do testing communication.
            </p>
            <p>
              Establish a software company has been the object that I joins hands. The now developed PerfetComm RS232 Communication Protocol Development & Special Testing Software is my first step. I believe it will be very helpful to many engineers in the RS232/422/485 field, software communication protocol development, and USB to Wifi, Bluetooth, UHF transmissions. Many devices use RS232 as the interface between computer and telecommunication. Therefore, having RS232 telecommunication protocol testing and development, or RS485 group/distributed control, Console Port regulation is very helpful. Furthermore, with Universal Encoding Transform - simple, easy to use, and arbitrarily create.
            </p>
          </div>
        </div>

        {/* Services & Expertise */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Expertise</h2>
            <p className="text-xl text-gray-600">專業服務範圍 | Professional Services</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-3 mb-6">
                <Settings className="w-8 h-8 text-blue-600" />
                <h3 className="text-2xl font-bold text-gray-900">Industrial Control Systems</h3>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                  <span>RS-232/422/485 Communication Protocol Development & Testing</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                  <span>Industrial PC, PLC, SCADA, PAC System Integration</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                  <span>工控、工業電腦整合方案</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                  <span>Console Port Control & Management</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-3 mb-6">
                <Cpu className="w-8 h-8 text-indigo-600" />
                <h3 className="text-2xl font-bold text-gray-900">Custom Software Development</h3>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                  <span>POS Systems & Database Solutions</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                  <span>USB to Wifi/Bluetooth/UHF Transmission Solutions</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                  <span>客製化系統開發服務</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                  <span>Universal Encoding Transform Support</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Project History */}
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-10 mb-16 border-2 border-blue-100">
          <div className="flex items-center gap-3 mb-8">
            <History className="w-10 h-10 text-indigo-600" />
            <h2 className="text-4xl font-bold text-gray-900">Project History</h2>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="flex items-center gap-3 mb-3">
                <Award className="w-6 h-6 text-blue-600" />
                <h3 className="text-2xl font-bold text-gray-900">DOS Era | DOS 時代</h3>
              </div>
              <p className="text-lg text-gray-700 pl-9">
                <strong>Pager Instrument Control Semi-Automatic Testing System</strong>
              </p>
              <p className="text-gray-600 pl-9 mt-2">
                呼叫器儀控半自動測試系統
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="flex items-center gap-3 mb-3">
                <Award className="w-6 h-6 text-indigo-600" />
                <h3 className="text-2xl font-bold text-gray-900">Windows Era | Windows 時代</h3>
              </div>
              <p className="text-lg text-gray-700 pl-9">
                <strong>Wu Jie Dam Flood Discharge Broadcasting System</strong>
              </p>
              <p className="text-gray-600 pl-9 mt-2">
                武界壩排洪廣播系統
              </p>
            </div>
          </div>
        </div>

        {/* Current Offering */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-10 text-white mb-16">
          <h2 className="text-4xl font-bold mb-6 text-center">Our Commitment</h2>
          <div className="space-y-4 text-lg leading-relaxed max-w-4xl mx-auto">
            <p>
              如今，開發完成，我又可以幫客戶開發客製軟體，在工控、工業電腦、PLC、SCADA、PAC、POS、資料庫等領域，歡迎大家委託本工作室，從事客製系統的開發，誠摯歡迎大家不吝惜指教與照顧，本人願貢獻本人數十年的經驗，幫貴單位開發。
            </p>
            <p className="border-t border-white/30 pt-4 mt-4">
              At present, with development completed, I can develop custom software for clients in fields including industrial control, industrial computers, PLC, SCADA, PAC, POS, and databases. We welcome everyone to entrust this workshop with custom system development. We sincerely welcome your guidance and support. I wish to contribute my decades of experience to help your company or bureau.
            </p>
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-white rounded-2xl shadow-lg p-10 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Partner With Us</h2>
          <p className="text-xl text-gray-700 mb-6 max-w-3xl mx-auto">
            We provide industry custom design software development.
            <br />
            歡迎企業與組織尋求工業軟體客製化開發合作。
          </p>
          <p className="text-lg text-gray-600 mb-8">
            Produced by <strong className="text-blue-600">智訊科技 Wismachion Soft & Tech Inc.</strong>
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-10 py-4 rounded-lg text-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
          >
            Back to Home | 返回首頁
          </button>
        </div>
      </div>
    </div>
  );
}

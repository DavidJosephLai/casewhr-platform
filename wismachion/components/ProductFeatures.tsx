import { Radio, Code, BarChart3, Settings, FileText, Plug } from 'lucide-react';
import { Card } from '../../components/ui/card';

export function ProductFeatures() {
  const features = [
    {
      icon: <Radio className="w-8 h-8 text-blue-600" />,
      title: 'RS-232 Communication',
      description: 'Full support for serial port communication with advanced configuration options'
    },
    {
      icon: <Code className="w-8 h-8 text-blue-600" />,
      title: 'Protocol Development',
      description: 'Design and test custom communication protocols with built-in tools'
    },
    {
      icon: <BarChart3 className="w-8 h-8 text-blue-600" />,
      title: 'Data Analysis',
      description: 'Real-time monitoring and analysis of communication data streams'
    },
    {
      icon: <Settings className="w-8 h-8 text-blue-600" />,
      title: 'Special Testing',
      description: 'Comprehensive testing tools for protocol validation and debugging'
    },
    {
      icon: <FileText className="w-8 h-8 text-blue-600" />,
      title: 'Data Logging',
      description: 'Automatic recording and export of communication sessions'
    },
    {
      icon: <Plug className="w-8 h-8 text-blue-600" />,
      title: 'Multi-Port Support',
      description: 'Connect and manage multiple serial ports simultaneously'
    }
  ];

  return (
    <section id="features" className="py-20 bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">
            Powerful Features
          </h2>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Everything you need for professional RS-232 communication and protocol development
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="p-6 hover:shadow-2xl transition-all border-2 border-cyan-500 bg-blue-800/50 backdrop-blur-sm hover:bg-blue-700/60 hover:border-cyan-400">
              <div className="mb-4 text-cyan-300">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-blue-100">
                {feature.description}
              </p>
            </Card>
          ))}
        </div>

        {/* Technical Specifications */}
        <div className="mt-16 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Technical Specifications</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <SpecItem label="Baud Rate" value="110 - 256000 bps" />
            <SpecItem label="Data Bits" value="5, 6, 7, 8 bits" />
            <SpecItem label="Stop Bits" value="1, 1.5, 2 bits" />
            <SpecItem label="Parity" value="None, Even, Odd, Mark, Space" />
            <SpecItem label="Flow Control" value="None, Hardware, Software" />
            <SpecItem label="Platforms" value="Windows 7/8/10/11" />
            <SpecItem label="Ports" value="COM1 - COM256" />
            <SpecItem label="File Export" value="TXT, CSV, HEX, BIN" />
          </div>
        </div>
      </div>
    </section>
  );
}

function SpecItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-sm text-gray-500 mb-1">{label}</div>
      <div className="font-semibold text-gray-900">{value}</div>
    </div>
  );
}
import { Button } from '../../components/ui/button';
import { Download, Zap, Shield, Clock } from 'lucide-react';

interface WismachionHeroProps {
  onGetStarted: () => void;
  onFreeTrial?: () => void; // 🆕
}

export function WismachionHero({ onGetStarted, onFreeTrial }: WismachionHeroProps) {
  return (
    <section className="py-20 bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-white">
            <div className="inline-block mb-4 px-4 py-2 bg-cyan-600 rounded-full text-sm font-medium border-2 border-cyan-400">
              Professional RS-232 Communication Tool
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              PerfectComm
            </h1>
            
            <p className="text-xl md:text-2xl mb-4 text-cyan-200">
              RS-232 Communication Software
            </p>
            
            <p className="text-lg mb-8 text-blue-100 leading-relaxed">
              Professional communication protocol development and testing software. 
              Powerful, reliable, and easy to use for industrial serial communication.
            </p>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-cyan-300">1000+</div>
                <div className="text-sm text-blue-200">Users</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-cyan-300">24/7</div>
                <div className="text-sm text-blue-200">Support</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-cyan-300">5★</div>
                <div className="text-sm text-blue-200">Rating</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <Button 
                size="lg" 
                onClick={onGetStarted}
                className="bg-cyan-500 text-white hover:bg-cyan-600 text-lg px-8 shadow-lg hover:shadow-xl transition-all"
              >
                <Download className="w-5 h-5 mr-2" />
                Get Started
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="border-2 border-cyan-400 text-cyan-100 hover:bg-cyan-600 text-lg px-8"
                onClick={onFreeTrial}
              >
                Try Free Trial
              </Button>
            </div>
          </div>

          {/* Right Content - Features Grid */}
          <div className="grid grid-cols-2 gap-4">
            <FeatureCard
              icon={<Zap className="w-8 h-8" />}
              title="High Performance"
              description="Fast and stable communication"
            />
            <FeatureCard
              icon={<Shield className="w-8 h-8" />}
              title="Secure"
              description="Industry-grade security"
            />
            <FeatureCard
              icon={<Clock className="w-8 h-8" />}
              title="Real-time"
              description="Instant data transmission"
            />
            <FeatureCard
              icon={<Download className="w-8 h-8" />}
              title="Easy Setup"
              description="Quick installation"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-blue-800 border-2 border-cyan-500 rounded-xl p-6 hover:bg-blue-700 hover:border-cyan-400 transition-all shadow-xl hover:shadow-2xl">
      <div className="text-cyan-300 mb-3">{icon}</div>
      <h3 className="text-white font-semibold mb-1">{title}</h3>
      <p className="text-blue-200 text-sm">{description}</p>
    </div>
  );
}
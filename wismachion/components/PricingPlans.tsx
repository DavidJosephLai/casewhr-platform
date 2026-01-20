import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Check, Star, Building2 } from 'lucide-react';
import { useState } from 'react';

interface PricingPlansProps {
  onSelectPlan: (plan: 'standard' | 'enterprise') => void;
}

export function PricingPlans({ onSelectPlan }: PricingPlansProps) {
  const [currency, setCurrency] = useState<'USD' | 'TWD'>('USD');

  const plans = [
    {
      id: 'standard' as const,
      name: 'Standard Edition',
      description: 'Perfect for individual developers and small teams',
      priceUSD: 100,
      priceTWD: 3000,
      icon: <Star className="w-8 h-8 text-blue-600" />,
      features: [
        'Single User License',
        'RS-232 Communication',
        'Protocol Development Tools',
        'Data Logging & Export',
        'Multi-Port Support (up to 4)',
        'Email Support',
        'Free Updates (1 year)',
        'Commercial Use'
      ],
      popular: false
    },
    {
      id: 'enterprise' as const,
      name: 'Enterprise Edition',
      description: 'Advanced features for professional teams',
      priceUSD: 200,
      priceTWD: 6000,
      icon: <Building2 className="w-8 h-8 text-purple-600" />,
      features: [
        'Multi-User License (up to 5)',
        'All Standard Features',
        'Advanced Protocol Analysis',
        'Custom Script Support',
        'Unlimited Multi-Port Support',
        'Priority Support (24/7)',
        'Free Updates (Lifetime)',
        'Team Collaboration Tools',
        'API Access',
        'Custom Branding'
      ],
      popular: true
    }
  ];

  return (
    <section id="pricing" className="py-20 bg-gradient-to-br from-blue-900 via-blue-800 to-cyan-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-blue-100 mb-6">
            Choose the plan that fits your needs
          </p>

          {/* Currency Toggle */}
          <div className="inline-flex bg-blue-950/50 backdrop-blur-sm rounded-lg p-1 shadow-lg border border-cyan-500">
            <button
              onClick={() => setCurrency('USD')}
              className={`px-6 py-2 rounded-md font-medium transition-all ${
                currency === 'USD' 
                  ? 'bg-cyan-500 text-white shadow-lg' 
                  : 'text-blue-100 hover:text-white'
              }`}
            >
              USD ($)
            </button>
            <button
              onClick={() => setCurrency('TWD')}
              className={`px-6 py-2 rounded-md font-medium transition-all ${
                currency === 'TWD' 
                  ? 'bg-cyan-500 text-white shadow-lg' 
                  : 'text-blue-100 hover:text-white'
              }`}
            >
              TWD (NT$)
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <Card 
              key={plan.id}
              className={`p-8 relative bg-blue-800/60 backdrop-blur-sm ${
                plan.popular 
                  ? 'border-2 border-cyan-400 shadow-2xl' 
                  : 'border-2 border-cyan-600 hover:border-cyan-500'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold shadow-lg">
                    MOST POPULAR
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <div className="inline-flex mb-4 text-cyan-300">{plan.icon}</div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  {plan.name}
                </h3>
                <p className="text-blue-100 mb-6">
                  {plan.description}
                </p>
                <div className="mb-6">
                  <div className="text-5xl font-bold text-white">
                    {currency === 'USD' ? '$' : 'NT$'}
                    {currency === 'USD' ? plan.priceUSD : plan.priceTWD.toLocaleString()}
                  </div>
                  <div className="text-blue-200 mt-1">One-time payment</div>
                </div>
                <Button
                  onClick={() => onSelectPlan(plan.id)}
                  className={`w-full ${
                    plan.popular
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 shadow-xl'
                      : 'bg-cyan-600 hover:bg-cyan-700 shadow-lg'
                  }`}
                  size="lg"
                >
                  Purchase Now
                </Button>
              </div>

              <div className="space-y-3">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-cyan-300 flex-shrink-0 mt-0.5" />
                    <span className="text-blue-50">{feature}</span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>

        {/* Trial Version */}
        <div className="mt-12 text-center">
          <Card className="max-w-2xl mx-auto p-8 bg-cyan-500/20 backdrop-blur-sm border-2 border-cyan-400">
            <h3 className="text-2xl font-bold text-white mb-3">
              Try Before You Buy
            </h3>
            <p className="text-blue-100 mb-6">
              Download our free 30-day trial with full features. No credit card required.
            </p>
            <Button variant="outline" size="lg" className="border-2 border-cyan-400 text-white hover:bg-cyan-500/30">
              Download Free Trial
            </Button>
          </Card>
        </div>
      </div>
    </section>
  );
}
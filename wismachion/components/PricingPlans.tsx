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
    <section id="pricing" className="py-20 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600 mb-6">
            Choose the plan that fits your needs
          </p>

          {/* Currency Toggle */}
          <div className="inline-flex bg-white rounded-lg p-1 shadow-sm border">
            <button
              onClick={() => setCurrency('USD')}
              className={`px-6 py-2 rounded-md font-medium transition-all ${
                currency === 'USD' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              USD ($)
            </button>
            <button
              onClick={() => setCurrency('TWD')}
              className={`px-6 py-2 rounded-md font-medium transition-all ${
                currency === 'TWD' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-600 hover:text-gray-900'
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
              className={`p-8 relative ${
                plan.popular 
                  ? 'border-2 border-purple-500 shadow-xl' 
                  : 'border-2 hover:border-blue-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    MOST POPULAR
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <div className="inline-flex mb-4">{plan.icon}</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {plan.name}
                </h3>
                <p className="text-gray-600 mb-6">
                  {plan.description}
                </p>
                <div className="mb-6">
                  <div className="text-5xl font-bold text-gray-900">
                    {currency === 'USD' ? '$' : 'NT$'}
                    {currency === 'USD' ? plan.priceUSD : plan.priceTWD.toLocaleString()}
                  </div>
                  <div className="text-gray-500 mt-1">One-time payment</div>
                </div>
                <Button
                  onClick={() => onSelectPlan(plan.id)}
                  className={`w-full ${
                    plan.popular
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                  size="lg"
                >
                  Purchase Now
                </Button>
              </div>

              <div className="space-y-3">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>

        {/* Trial Version */}
        <div className="mt-12 text-center">
          <Card className="max-w-2xl mx-auto p-8 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Try Before You Buy
            </h3>
            <p className="text-gray-600 mb-6">
              Download our free 30-day trial with full features. No credit card required.
            </p>
            <Button variant="outline" size="lg" className="border-2 border-green-600 text-green-700 hover:bg-green-50">
              Download Free Trial
            </Button>
          </Card>
        </div>
      </div>
    </section>
  );
}

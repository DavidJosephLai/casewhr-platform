import { ImageWithFallback } from "./figma/ImageWithFallback";
import { CheckCircle } from "lucide-react";

const highlights = [
  "Over 15 years of industry experience",
  "500+ successful projects delivered",
  "Trusted by leading global brands",
  "Award-winning team of experts",
];

export function About() {
  return (
    <section id="about" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1">
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1623679116710-78b05d2fe2f3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjB3b3Jrc3BhY2UlMjBkZXNrfGVufDF8fHx8MTc2NDQ4ODI5MHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
              alt="Modern workspace"
              className="rounded-lg shadow-xl w-full"
            />
          </div>
          <div className="order-1 md:order-2">
            <h2 className="text-4xl mb-6">About Siddharam</h2>
            <p className="text-lg text-gray-600 mb-6">
              We are a forward-thinking business consulting firm dedicated to helping organizations achieve their full potential. Our team of seasoned professionals brings together diverse expertise to deliver innovative solutions that drive real results.
            </p>
            <p className="text-lg text-gray-600 mb-8">
              From startups to Fortune 500 companies, we partner with businesses across industries to navigate complex challenges, seize opportunities, and build sustainable competitive advantages.
            </p>
            <div className="space-y-3">
              {highlights.map((highlight, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
                  <span className="text-lg">{highlight}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

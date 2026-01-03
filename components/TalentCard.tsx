import { Card, CardContent, CardFooter, CardHeader } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { User, MapPin, Briefcase, Calendar, Star, BadgeCheck } from "lucide-react";
import { useLanguage } from "../lib/LanguageContext";
import { translations, getTranslation } from "../lib/translations";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { useState, useEffect, useCallback } from "react";
import { projectId, publicAnonKey } from "../utils/supabase/info";

interface TalentCardProps {
  talent: {
    id: string;
    user_id: string;
    email: string;
    full_name: string;
    company?: string;
    job_title?: string;
    bio?: string;
    skills?: string | string[];
    website?: string;
    created_at: string;
    avatar_url?: string;
    subscription_plan?: 'free' | 'pro' | 'enterprise';
  };
  onViewProfile: () => void;
}

export function TalentCard({ talent, onViewProfile }: TalentCardProps) {
  const { language } = useLanguage();
  const t = getTranslation(language as any).talent;
  const [rating, setRating] = useState<{ average: number; count: number } | null>(null);
  const [fetchAttempted, setFetchAttempted] = useState(false);

  // Fetch rating for this talent - use useCallback to stabilize function reference
  const fetchRating = useCallback(async () => {
    // Prevent multiple fetch attempts
    if (fetchAttempted) return;
    setFetchAttempted(true);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/reviews/user/${talent.user_id}`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setRating({
          average: data.average_rating || 0,
          count: data.total_reviews || 0,
        });
      } else {
        // Silently handle error - rating is optional
        setRating(null);
      }
    } catch (error) {
      // Silently handle error - rating is optional, don't spam console
      setRating(null);
    }
  }, [talent.user_id, fetchAttempted]);

  useEffect(() => {
    fetchRating();
  }, [fetchRating]);

  // Handle both string and array formats for skills
  const skillsArray = talent.skills
    ? (typeof talent.skills === 'string' 
        ? talent.skills.split(',').map(s => s.trim()).filter(Boolean)
        : Array.isArray(talent.skills)
          ? talent.skills
          : [])
    : [];

  const displaySkills = skillsArray.slice(0, 3);
  const remainingSkills = skillsArray.length - 3;

  // Format date
  const joinedDate = new Date(talent.created_at).toLocaleDateString(
    language === 'en' ? 'en-US' : 'zh-TW',
    { year: 'numeric', month: 'short' }
  );

  return (
    <Card className="hover:shadow-lg transition-shadow duration-300 flex flex-col h-full">
      <CardHeader>
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage
              src={talent.avatar_url}
              alt={talent.full_name || talent.email}
            />
            <AvatarFallback className="bg-blue-100">
              <User className="h-8 w-8 text-blue-600" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <h3 className="truncate">
                  {talent.full_name || talent.email}
                </h3>
                {/* Verified Badge for Pro and Enterprise users */}
                {(talent.subscription_plan === 'pro' || talent.subscription_plan === 'enterprise') && (
                  <BadgeCheck className="h-5 w-5 text-blue-600 flex-shrink-0" title={language === 'en' ? 'Verified Professional' : '已認證專業人士'} />
                )}
              </div>
              {/* Subscription badge in top right */}
              {talent.subscription_plan && talent.subscription_plan !== 'free' && (
                <Badge variant="secondary" className="text-xs flex-shrink-0 bg-blue-100 text-blue-700">
                  {talent.subscription_plan === 'pro' ? (language === 'en' ? 'Pro' : '專業版') : (language === 'en' ? 'Enterprise' : '企業版')}
                </Badge>
              )}
            </div>
            {/* Rating Display */}
            {rating && rating.count > 0 && (
              <div className="flex items-center gap-1 mt-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium text-gray-700">
                  {rating.average.toFixed(1)}
                </span>
                <span className="text-xs text-gray-500">
                  ({rating.count} {rating.count === 1 ? (language === 'en' ? 'review' : '評價') : (language === 'en' ? 'reviews' : '評價')})
                </span>
              </div>
            )}
            {talent.job_title && (
              <div className="flex items-center gap-2 text-gray-600 mt-1">
                <Briefcase className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm truncate">{talent.job_title}</span>
              </div>
            )}
            {talent.company && (
              <div className="flex items-center gap-2 text-gray-500 mt-1">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm truncate">{talent.company}</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        {talent.bio && (
          <p className="text-sm text-gray-600 line-clamp-3 mb-4">
            {talent.bio}
          </p>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">{t.card.skills}:</span>
            {skillsArray.length === 0 && (
              <span className="text-xs text-gray-400">{t.card.noSkills}</span>
            )}
          </div>
          {skillsArray.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {displaySkills.map((skill, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {skill}
                </Badge>
              ))}
              {remainingSkills > 0 && (
                <Badge variant="outline" className="text-xs">
                  +{remainingSkills}
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between pt-4 border-t">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Calendar className="h-3 w-3" />
          <span>{t.card.joined} {joinedDate}</span>
        </div>
        <Button
          onClick={onViewProfile}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {t.card.viewProfile}
        </Button>
      </CardFooter>
    </Card>
  );
}
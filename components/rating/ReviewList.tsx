import { useEffect, useState } from "react";
import { StarRating } from "./StarRating";
import { Card } from "../ui/card";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { useLanguage } from "../../lib/LanguageContext";
import { translations, getTranslation } from "../../lib/translations";
import { Skeleton } from "../ui/skeleton";
import { projectId, publicAnonKey } from "../../utils/supabase/info";

interface Review {
  id: string;
  project_id: string;
  reviewer_id: string;
  recipient_id: string;
  recipient_type: string;
  rating: number;
  comment: string;
  created_at: string;
  reviewer_name?: string;
  reviewer_email?: string;
  project_title?: string;
}

interface ReviewListProps {
  userId: string;
}

export function ReviewList({ userId }: ReviewListProps) {
  const { language } = useLanguage();
  const t = getTranslation(language).reviews;
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);

  useEffect(() => {
    fetchReviews();
  }, [userId]);

  const fetchReviews = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/reviews/user/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        // Handle both successful response and graceful error fallback
        setReviews(data.reviews || []);
        setAverageRating(data.average_rating || 0);
      } else {
        console.warn("Failed to fetch reviews, using empty state:", data.error);
        setReviews([]);
        setAverageRating(0);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
      // Gracefully handle errors by showing empty state
      setReviews([]);
      setAverageRating(0);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <Card className="p-8 text-center text-gray-500">
        {t.noReviewsYet}
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-6 bg-blue-50">
        <div className="flex items-center gap-4">
          <div>
            <div className="text-4xl">{averageRating.toFixed(1)}</div>
            <StarRating rating={Math.round(averageRating)} readonly size="md" />
          </div>
          <div className="text-gray-600">
            {reviews.length} {reviews.length === 1 ? t.review : t.reviews}
          </div>
        </div>
      </Card>

      {reviews.map((review) => (
        <Card key={review.id} className="p-6">
          <div className="flex items-start gap-4">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-blue-100 text-blue-600">
                {review.reviewer_name?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-semibold text-gray-900">
                    {review.reviewer_name || 'Anonymous User'}
                  </h4>
                  {review.project_title && (
                    <p className="text-sm text-gray-500">
                      {t.project}: {review.project_title}
                    </p>
                  )}
                </div>
                <span className="text-sm text-gray-500 whitespace-nowrap ml-4">
                  {new Date(review.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="mb-2">
                <StarRating rating={review.rating} readonly size="sm" />
              </div>
              {review.comment && (
                <p className="text-gray-700 leading-relaxed">{review.comment}</p>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
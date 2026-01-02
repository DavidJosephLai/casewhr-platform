import { useLanguage } from "../../lib/LanguageContext";
import { toast } from "sonner";
import { projectId, publicAnonKey } from "../../utils/supabase/info";

interface ReviewFormProps {
  projectId: string;
  recipientId: string;
  recipientType: "client" | "freelancer";
  recipientName?: string;
  onSuccess?: () => void;
}

export function ReviewForm({ projectId, recipientId, recipientType, recipientName, onSuccess }: ReviewFormProps) {
  const { t } = useLanguage();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error(t("pleaseSelectRating"));
      return;
    }

    setSubmitting(true);
    try {
      const accessToken = localStorage.getItem("sb-access-token");
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/reviews/submit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            project_id: projectId,
            recipient_id: recipientId,
            recipient_type: recipientType,
            rating,
            comment,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t("failedToSubmitReview"));
      }

      toast.success(t("reviewSubmitted"));
      setRating(0);
      setComment("");
      onSuccess?.();
    } catch (error: any) {
      console.error("Error submitting review:", error);
      toast.error(error.message || t("failedToSubmitReview"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="p-6">
      <h3 className="mb-4">
        {t("rateYourExperience")} {recipientName && `with ${recipientName}`}
      </h3>
      
      <div className="space-y-4">
        <div>
          <label className="block mb-2">{t("rating")}</label>
          <StarRating rating={rating} onRatingChange={setRating} size="lg" />
        </div>

        <div>
          <label className="block mb-2">{t("comment")} ({t("optional")})</label>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t("shareYourThoughts")}
            rows={4}
          />
        </div>

        <Button onClick={handleSubmit} disabled={submitting || rating === 0} className="w-full">
          {submitting ? t("submitting") : t("submitReview")}
        </Button>
      </div>
    </Card>
  );
}
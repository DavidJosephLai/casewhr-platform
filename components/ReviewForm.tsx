import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Star, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface ReviewFormProps {
  projectId: string;
  recipientId: string;
  recipientName?: string;
  recipientType: 'client' | 'freelancer';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitted?: () => void;
  language?: 'en' | 'zh' | 'zh-TW' | 'zh-CN';
}

export function ReviewForm({ 
  projectId: projectIdProp,
  recipientId,
  recipientName,
  recipientType,
  open, 
  onOpenChange,
  onSubmitted,
  language = 'en' 
}: ReviewFormProps) {
  const { accessToken } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const translations = {
    en: {
      title: 'Submit Review',
      subtitle: recipientType === 'client' 
        ? `Review your experience working with ${recipientName || 'the client'}` 
        : `Review ${recipientName || 'the freelancer'}'s work`,
      rating: 'Rating',
      selectRating: 'Select a rating',
      comment: 'Comment',
      commentPlaceholder: 'Share your experience working on this project...',
      submit: 'Submit Review',
      submitting: 'Submitting...',
      cancel: 'Cancel',
      ratingRequired: 'Please select a rating',
      commentRequired: 'Please write a comment',
      submitSuccess: 'Review submitted successfully!',
      submitError: 'Failed to submit review',
    },
    zh: {
      title: '提交評價',
      subtitle: recipientType === 'client' 
        ? `評價與${recipientName || '案主'}的合作體驗` 
        : `評價${recipientName || '接案者'}的工作`,
      rating: '評分',
      selectRating: '選擇評分',
      comment: '評論',
      commentPlaceholder: '分享您在此項目上的工作體驗...',
      submit: '提交評價',
      submitting: '提交中...',
      cancel: '取消',
      ratingRequired: '請選擇評分',
      commentRequired: '請寫下評論',
      submitSuccess: '評價提交成功！',
      submitError: '提交評價失敗',
    },
    'zh-TW': {
      title: '提交評價',
      subtitle: recipientType === 'client' 
        ? `評價與${recipientName || '案主'}的合作體驗` 
        : `評價${recipientName || '接案者'}的工作`,
      rating: '評分',
      selectRating: '選擇評分',
      comment: '評論',
      commentPlaceholder: '分享您在此項目上的工作體驗...',
      submit: '提交評價',
      submitting: '提交中...',
      cancel: '取消',
      ratingRequired: '請選擇評分',
      commentRequired: '請寫下評論',
      submitSuccess: '評價提交成功！',
      submitError: '提交評價失敗',
    },
    'zh-CN': {
      title: '提交评价',
      subtitle: recipientType === 'client' 
        ? `评价与${recipientName || '客户'}的合作体验` 
        : `评价${recipientName || '接案者'}的工作`,
      rating: '评分',
      selectRating: '选择评分',
      comment: '评论',
      commentPlaceholder: '分享您在此项目上的工作体验...',
      submit: '提交评价',
      submitting: '提交中...',
      cancel: '取消',
      ratingRequired: '请选择评分',
      commentRequired: '请写下评论',
      submitSuccess: '评价提交成功！',
      submitError: '提交评价失败',
    },
  };

  const t = translations[language];

  const handleSubmit = async () => {
    // Validation
    if (rating === 0) {
      toast.error(t.ratingRequired);
      return;
    }
    if (!comment.trim()) {
      toast.error(t.commentRequired);
      return;
    }

    setSubmitting(true);

    try {
      console.log('Submitting review:', {
        project_id: projectIdProp,
        recipient_id: recipientId,
        recipient_type: recipientType,
        rating,
        comment,
      });

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/reviews/submit`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            project_id: projectIdProp,
            recipient_id: recipientId,
            recipient_type: recipientType,
            rating,
            comment,
          }),
        }
      );

      console.log('Review response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Review submission error:', errorData);
        throw new Error(errorData.error || 'Failed to submit review');
      }

      const result = await response.json();
      console.log('Review submitted successfully:', result);

      toast.success(t.submitSuccess);
      
      // Reset form
      setRating(0);
      setComment('');
      
      // Close dialog
      onOpenChange(false);
      
      // Callback
      if (onSubmitted) {
        onSubmitted();
      }
    } catch (error: any) {
      console.error('Submit review error:', error);
      toast.error(`${t.submitError}: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      onOpenChange(false);
      // Reset on close
      setRating(0);
      setComment('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t.title}</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {t.subtitle}
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Rating */}
          <div className="space-y-2">
            <label className="block">{t.rating}</label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110 focus:outline-none"
                >
                  <Star
                    className={`size-8 ${
                      star <= (hoverRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-2 text-sm text-muted-foreground">
                  {rating} / 5
                </span>
              )}
            </div>
            {rating === 0 && (
              <p className="text-xs text-muted-foreground">{t.selectRating}</p>
            )}
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <label className="block">{t.comment}</label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t.commentPlaceholder}
              rows={4}
              disabled={submitting}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={handleSubmit}
              disabled={submitting || rating === 0}
              className="flex-1"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  {t.submitting}
                </>
              ) : (
                t.submit
              )}
            </Button>
            <Button
              onClick={handleClose}
              disabled={submitting}
              variant="outline"
            >
              {t.cancel}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
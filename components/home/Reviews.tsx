import { homepage } from "@/lib/homepage";
import { SectionHeader } from "@/components/ui/SectionHeader";

export function Reviews() {
  const { reviews } = homepage;

  return (
    <section id="reviews" className="section">
      <div className="wrap">
        <SectionHeader title={reviews.title} />
        <div className="review-row">
          {reviews.items.map((review) => (
            <blockquote key={review.who} className="review">
              <p>“{review.quote.replace(/^"|"$/g, "")}”</p>
              <div className="who">{review.who}</div>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}

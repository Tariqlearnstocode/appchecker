import { Metadata } from 'next';
import { PricingContent } from '@/components/ui/Pricing';
import { getURL } from '@/utils/helpers';

const siteUrl = getURL();
const ogImage = `${siteUrl}/opengraph-image.png`;

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Flexible pricing plans for income verification. Pay-as-you-go at $14.99 per verification, Starter plan at $59/month (10 verifications), or Pro plan at $129/month (50 verifications).',
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <PricingContent />
    </div>
  );
}

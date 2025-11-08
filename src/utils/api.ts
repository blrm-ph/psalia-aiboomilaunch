import { Creative, CreativeInput, ResultsData } from '../types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function scoreCreatives(
  bip: string,
  creatives: Creative[]
): Promise<ResultsData> {
  const creativesWithImages: CreativeInput[] = await Promise.all(
    creatives.map(async (creative) => {
      const imageData = await fileToBase64(creative.file);
      let productImageData: string | undefined;

      if (creative.is_ecommerce && creative.highlighted_product_image) {
        productImageData = await fileToBase64(creative.highlighted_product_image);
      }

      return {
        filename: creative.filename,
        imageData,
        is_ecommerce: creative.is_ecommerce,
        highlighted_product: creative.highlighted_product,
        highlighted_product_image: productImageData,
        platform: creative.platform
      };
    })
  );

  const apiUrl = `${SUPABASE_URL}/functions/v1/score-creatives`;

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      bip,
      creatives: creativesWithImages
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(error.error || 'Failed to score creatives');
  }

  return response.json();
}

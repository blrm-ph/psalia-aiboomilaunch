export interface Creative {
  id: string;
  file: File;
  preview: string;
  filename: string;
  is_ecommerce: boolean;
  highlighted_product: string;
  highlighted_product_image?: File;
  highlighted_product_preview?: string;
  platform: string;
}

export interface CreativeInput {
  filename: string;
  imageData: string;
  is_ecommerce: boolean;
  highlighted_product: string;
  highlighted_product_image?: string;
  platform: string;
}

export interface CreativeResult {
  filename: string;
  imageData: string;
  overall_score: number;
  brand_subtotal: number;
  ecommerce_subtotal?: number;
  brand_scores: {
    [key: string]: number;
  };
  ecommerce_scores?: {
    [key: string]: number;
  };
  strengths: string[];
  risks: string[];
  recommendations: string[];
}

export interface ResultsData {
  executive_summary: string;
  comparison_table?: string;
  creatives: CreativeResult[];
  csv_data?: string;
}

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import OpenAI from "npm:openai@4.47.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CreativeInput {
  filename: string;
  imageData: string;
  is_ecommerce: boolean;
  highlighted_product: string;
  highlighted_product_image?: string;
  platform: string;
}

interface RequestBody {
  bip: string;
  creatives: CreativeInput[];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { bip, creatives }: RequestBody = await req.json();

    if (!bip || !creatives || creatives.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: bip and creatives" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const openai = new OpenAI({
      apiKey: openaiApiKey,
    });

    const parsedBIP = JSON.parse(bip);

    const systemPrompt = `You are a Brand Creative Evaluator AI specialized in analyzing creative assets against Brand Interpretation Profiles (BIP).

CRITICAL: You must score using a 1-5 scale for individual parameters.

SCORING FRAMEWORK (1-5 scale):
1 = Very Poor, 2 = Needs Improvement, 3 = Acceptable, 4 = Strong, 5 = Fully On-Brand

Brand Expression Parameters (score ALL creatives):
- Logo usage (no modification or alteration of a logo. it has to be present in its entirety as shared)
- Color palette
- Typography
- Imagery style
- Tone of voice
- Tagline / messaging alignment
- Audience fit
- Core message clarity

E-commerce Product Showcase Parameters (ONLY if is_ecommerce = true):
- Product visibility & dominance
- Product accuracy (color/form/texture)
- Product angle & presentation
- Usage / context clarity (if applicable)
- CTA integration & prominence

SCORING TOTALS:
- Brand subtotal: Sum of all 8 brand scores (max 40)
- E-commerce subtotal: Sum of all 5 e-commerce scores (max 25, only if is_ecommerce = true)
- Overall score for non-ecommerce: Brand subtotal (max 40)
- Overall score for ecommerce: Brand subtotal + E-commerce subtotal (max 65)

RECOMMENDATIONS:
For any parameter scored 3 or below, provide at least one specific, actionable recommendation.
Recommendations must:
- Reference concrete adjustments (e.g., \"Increase logo size by ~15% and maintain clear space at 1× logo height\")
- Avoid vague language (no \"make it better\" or \"improve tone\")
- Be specific and measurable

The BIP includes:
- Logo Files (for brand consistency checks)
- Tone of Voice Reference (text description or example images with copy)
- Pre-approved Creatives (examples of approved brand work)
- Target Audience Description

For each creative to score, you will receive:
- filename: The name of the creative file
- is_ecommerce: Boolean indicating if this is an e-commerce creative
- highlighted_product: The specific product featured (if applicable)
- highlighted_product_image: A separate image of the highlighted product (for e-commerce creatives)
- platform: The intended platform (IG Feed, IG Story, Web Hero, Display, Amazon PDP)

You must return a JSON response with the following structure:

{
  \"executive_summary\": \"Brief 2-3 sentence overview of overall brand alignment across all creatives\",
  \"comparison_table\": \"Markdown table comparing all creatives (if 2+ provided)\",
  \"creatives\": [
    {
      \"filename\": \"creative1.jpg\",
      \"imageData\": \"data:image/jpeg;base64,...\",
      \"overall_score\": 35,
      \"brand_subtotal\": 35,
      \"ecommerce_subtotal\": 22,
      \"brand_scores\": {
        \"Logo usage\": 5,
        \"Color palette\": 4,
        \"Typography\": 4,
        \"Imagery style\": 5,
        \"Tone of voice\": 4,
        \"Tagline / messaging alignment\": 5,
        \"Audience fit\": 4,
        \"Core message clarity\": 4
      },
      \"ecommerce_scores\": {
        \"Product visibility & dominance\": 5,
        \"Product accuracy\": 4,
        \"Product angle & presentation\": 4,
        \"Usage / context clarity\": 5,
        \"CTA integration & prominence\": 4
      },
      \"strengths\": [
        \"Logo is properly sized and positioned with adequate clear space\",
        \"Brand colors are consistently applied throughout the design\"
      ],
      \"risks\": [
        \"Typography hierarchy could be stronger for mobile viewing\",
        \"Messaging may not resonate with younger demographic\"
      ],
      \"recommendations\": [
        \"Increase headline font size from 18pt to 24pt for better mobile readability\",
        \"Add a secondary CTA button to capture hesitant buyers\"
      ]
    }
  ],
  \"csv_data\": \"base64-encoded CSV string (only if 2+ creatives)\"
}

IMPORTANT: Include the imageData field in each creative result - copy it from the input creative's imageData.

The CSV should include all individual parameter scores for detailed analysis.

Analyze images thoroughly, considering:
- Visual elements (colors, typography, layout, imagery)
- Brand consistency and recognition
- Message clarity and tone
- Platform-specific best practices
- Legal/compliance requirements (if logos are altered, this is a critical violation)
- Product presentation quality (for e-commerce)
- Call-to-action effectiveness

Be specific and actionable in your feedback. Every recommendation must be concrete and measurable.`;

    const creativesMetadata = creatives.map((c) => ({
      filename: c.filename,
      is_ecommerce: c.is_ecommerce,
      highlighted_product: c.highlighted_product,
      platform: c.platform,
    }));

    const bipImages: Array<{ type: string; image_url: { url: string } }> = [];

    if (parsedBIP.logoFiles?.length) {
      parsedBIP.logoFiles.forEach((img: { data: string }) => {
        bipImages.push({
          type: "image_url",
          image_url: { url: img.data }
        });
      });
    }

    if (parsedBIP.toneOfVoiceMode === 'images' && parsedBIP.toneOfVoiceImages?.length) {
      parsedBIP.toneOfVoiceImages.forEach((img: { data: string }) => {
        bipImages.push({
          type: "image_url",
          image_url: { url: img.data }
        });
      });
    }

    if (parsedBIP.preApprovedCreatives?.length) {
      parsedBIP.preApprovedCreatives.forEach((img: { data: string }) => {
        bipImages.push({
          type: "image_url",
          image_url: { url: img.data }
        });
      });
    }

    const bipDescription = `Target Audience: ${parsedBIP.targetAudience}
${parsedBIP.toneOfVoiceMode === 'text' && parsedBIP.toneOfVoiceText ? `\nTone of Voice: ${parsedBIP.toneOfVoiceText}` : ''}`;

    const userMessage = `Brand Interpretation Profile (BIP):

${bipDescription}

Brand reference images are included above showing:
- Logo files (for consistency checks - logos must NOT be modified or altered)
${parsedBIP.toneOfVoiceMode === 'images' ? '- Tone of voice examples (images with copy)' : ''}
${parsedBIP.preApprovedCreatives?.length ? '- Pre-approved creatives (examples of approved work)' : ''}

Creatives to analyze:
${JSON.stringify(creativesMetadata, null, 2)}

The creative images to score are provided after this message.

IMPORTANT SCORING INSTRUCTIONS:
1. Score each parameter on a 1-5 scale
2. Calculate brand_subtotal as sum of all 8 brand scores (max 40)
3. If is_ecommerce=true, calculate ecommerce_subtotal as sum of 5 e-commerce scores (max 25)
4. Overall score = brand_subtotal (+ ecommerce_subtotal if applicable)
5. For any score of 3 or below, provide specific, actionable recommendations
6. Include the imageData field from the input in your response for each creative

Please analyze the creatives against the BIP and return a JSON response.`;

    const creativeImages: Array<{ type: string; image_url: { url: string } }> = [];

    creatives.forEach((creative) => {
      creativeImages.push({
        type: "image_url",
        image_url: {
          url: creative.imageData,
        },
      });

      if (creative.is_ecommerce && creative.highlighted_product_image) {
        creativeImages.push({
          type: "image_url",
          image_url: {
            url: creative.highlighted_product_image,
          },
        });
      }
    });

    const messageContent: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
      {
        type: "text",
        text: userMessage,
      },
      ...bipImages,
      ...creativeImages,
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: messageContent,
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 4096,
    });

    const result = completion.choices[0].message.content;
    const parsedResult = JSON.parse(result || "{}");

    if (parsedResult.creatives) {
      parsedResult.creatives = parsedResult.creatives.map((creative: any, index: number) => {
        if (!creative.imageData) {
          creative.imageData = creatives[index].imageData;
        }
        return creative;
      });
    }

    if (creatives.length >= 2 && !parsedResult.csv_data) {
      const csvRows = [
        "Filename,Overall Score,Brand Subtotal,E-commerce Subtotal,Logo usage,Color palette,Typography,Imagery style,Tone of voice,Tagline / messaging alignment,Audience fit,Core message clarity,Product visibility & dominance,Product accuracy,Product angle & presentation,Usage / context clarity,CTA integration & prominence,Top Strength,Top Risk"
      ];

      parsedResult.creatives.forEach((creative: any) => {
        const row = [
          creative.filename,
          creative.overall_score,
          creative.brand_subtotal,
          creative.ecommerce_subtotal || "N/A",
          creative.brand_scores["Logo usage"] || "",
          creative.brand_scores["Color palette"] || "",
          creative.brand_scores["Typography"] || "",
          creative.brand_scores["Imagery style"] || "",
          creative.brand_scores["Tone of voice"] || "",
          creative.brand_scores["Tagline / messaging alignment"] || "",
          creative.brand_scores["Audience fit"] || "",
          creative.brand_scores["Core message clarity"] || "",
          creative.ecommerce_scores?.["Product visibility & dominance"] || "N/A",
          creative.ecommerce_scores?.["Product accuracy"] || "N/A",
          creative.ecommerce_scores?.["Product angle & presentation"] || "N/A",
          creative.ecommerce_scores?.["Usage / context clarity"] || "N/A",
          creative.ecommerce_scores?.["CTA integration & prominence"] || "N/A",
          `\"${creative.strengths[0] || ""}\"`,
          `\"${creative.risks[0] || ""}\"`
        ].join(",");
        csvRows.push(row);
      });

      const csvContent = csvRows.join("\n");
      const base64Csv = btoa(csvContent);
      parsedResult.csv_data = base64Csv;
    }

    return new Response(JSON.stringify(parsedResult), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error"
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});

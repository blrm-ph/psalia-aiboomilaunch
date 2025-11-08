import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RequestBody {
  creative: any;
  creativeImage: string;
  additionalComments: string;
  emails: string[];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { creative, creativeImage, additionalComments, emails }: RequestBody = await req.json();

    console.log('Received request to send feedback');
    console.log('Creative filename:', creative.filename);
    console.log('Email recipients:', emails);

    if (!creative || !emails || emails.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: creative and emails" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const sendgridApiKey = Deno.env.get("SENDGRID_API_KEY");
    if (!sendgridApiKey) {
      console.error('SendGrid API key not found');
      return new Response(
        JSON.stringify({ error: "SendGrid API key not configured" }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const maxScore = creative.ecommerce_subtotal !== undefined ? 65 : 40;

    let emailHtmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset=\"utf-8\">
  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">
  <style>
    body {
      font-family: 'Helvetica', 'Arial', sans-serif;
      line-height: 1.6;
      color: #1f2937;
      margin: 0;
      padding: 0;
      background-color: #f9fafb;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      padding: 0;
    }
    .header {
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0 0 10px 0;
      font-size: 28px;
      font-weight: bold;
    }
    .header p {
      margin: 0;
      font-size: 14px;
      opacity: 0.95;
    }
    .content {
      padding: 30px;
    }
    .creative-info {
      background: #f3f4f6;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 25px;
      border-left: 4px solid #2563eb;
    }
    .creative-info h2 {
      margin: 0 0 10px 0;
      font-size: 20px;
      color: #1f2937;
    }
    .creative-info p {
      margin: 5px 0;
      font-size: 14px;
      color: #4b5563;
    }
    .score-box {
      background: #1f2937;
      color: white;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      margin: 20px 0;
    }
    .score-box .score {
      font-size: 36px;
      font-weight: bold;
      line-height: 1;
      margin-bottom: 5px;
    }
    .score-box .label {
      font-size: 13px;
      opacity: 0.9;
    }
    .creative-image-container {
      text-align: center;
      margin: 25px 0;
    }
    .creative-image {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      border: 2px solid #e5e7eb;
    }
    .section {
      margin: 25px 0;
    }
    .section h3 {
      color: #1f2937;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 8px;
      font-size: 18px;
      margin-bottom: 15px;
    }
    .subtotals {
      display: table;
      width: 100%;
      margin: 15px 0;
    }
    .subtotal-item {
      display: table-cell;
      background: #f9fafb;
      padding: 15px;
      text-align: center;
      border-radius: 6px;
    }
    .subtotal-item + .subtotal-item {
      padding-left: 10px;
    }
    .subtotal-label {
      font-size: 11px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 5px;
    }
    .subtotal-value {
      font-size: 24px;
      font-weight: bold;
      color: #1f2937;
    }
    .scores-section h4 {
      margin: 20px 0 10px 0;
      font-size: 14px;
      color: #4b5563;
      font-weight: 600;
    }
    .score-item {
      background: #ffffff;
      padding: 12px;
      margin: 8px 0;
      border-radius: 6px;
      border: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .score-item .param {
      font-size: 13px;
      color: #4b5563;
      font-weight: 500;
    }
    .score-badge {
      padding: 4px 10px;
      border-radius: 4px;
      font-weight: bold;
      font-size: 13px;
    }
    .score-green {
      background: #d1fae5;
      color: #065f46;
    }
    .score-yellow {
      background: #fef3c7;
      color: #92400e;
    }
    .score-red {
      background: #fee2e2;
      color: #991b1b;
    }
    .feedback-box {
      padding: 15px;
      border-radius: 8px;
      margin: 15px 0;
    }
    .strengths {
      background: #d1fae5;
      border-left: 4px solid #10b981;
    }
    .risks {
      background: #fee2e2;
      border-left: 4px solid #ef4444;
    }
    .recommendations {
      background: #dbeafe;
      border-left: 4px solid #3b82f6;
    }
    .feedback-box h4 {
      margin: 0 0 10px 0;
      font-size: 14px;
      font-weight: bold;
    }
    .strengths h4 { color: #065f46; }
    .risks h4 { color: #991b1b; }
    .recommendations h4 { color: #1e40af; }
    ul {
      margin: 0;
      padding-left: 18px;
    }
    li {
      margin: 6px 0;
      font-size: 13px;
      line-height: 1.5;
    }
    .comments {
      background: #fffbeb;
      border: 2px solid #fbbf24;
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .comments h4 {
      margin: 0 0 8px 0;
      color: #92400e;
      font-size: 14px;
    }
    .comments p {
      margin: 0;
      font-size: 13px;
      color: #78350f;
      line-height: 1.5;
    }
    .footer {
      margin-top: 30px;
      padding: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      font-size: 12px;
      color: #6b7280;
      background: #f9fafb;
    }
    @media only screen and (max-width: 600px) {
      .content {
        padding: 20px;
      }
      .subtotals {
        display: block;
      }
      .subtotal-item {
        display: block;
        margin-bottom: 10px;
      }
      .subtotal-item + .subtotal-item {
        padding-left: 15px;
      }
    }
  </style>
</head>
<body>
  <div class=\"container\">
    <div class=\"header\">
      <h1>Creative Feedback Report</h1>
      <p>Brand Creative Analysis & Recommendations</p>
    </div>

    <div class=\"content\">
      <div class=\"creative-info\">
        <h2>${creative.filename}</h2>
        <p><strong>Type:</strong> ${creative.ecommerce_subtotal !== undefined ? 'E-commerce Creative' : 'Brand Creative'}</p>
        <div class=\"score-box\">
          <div class=\"score\">${creative.overall_score}/${maxScore}</div>
          <div class=\"label\">Overall Score</div>
        </div>
      </div>`;

    if (creativeImage) {
      emailHtmlContent += `
      <div class=\"creative-image-container\">
        <img src=\"${creativeImage}\" alt=\"Creative Preview\" class=\"creative-image\" />
      </div>`;
    }

    emailHtmlContent += `
      <div class=\"section\">
        <h3>Score Breakdown</h3>
        <table class=\"subtotals\" cellpadding=\"0\" cellspacing=\"10\">
          <tr>
            <td class=\"subtotal-item\">
              <div class=\"subtotal-label\">Brand Subtotal</div>
              <div class=\"subtotal-value\">${creative.brand_subtotal}/40</div>
            </td>`;

    if (creative.ecommerce_subtotal !== undefined) {
      emailHtmlContent += `
            <td class=\"subtotal-item\">
              <div class=\"subtotal-label\">E-commerce Subtotal</div>
              <div class=\"subtotal-value\">${creative.ecommerce_subtotal}/25</div>
            </td>`;
    }

    emailHtmlContent += `
          </tr>
        </table>

        <div class=\"scores-section\">
          <h4>Brand Expression Scores (1-5 Scale)</h4>`;

    for (const [param, score] of Object.entries(creative.brand_scores)) {
      const badgeClass = score >= 4 ? 'score-green' : score === 3 ? 'score-yellow' : 'score-red';
      emailHtmlContent += `
          <div class=\"score-item\">
            <span class=\"param\">${param}</span>
            <span class=\"score-badge ${badgeClass}\">${score}/5</span>
          </div>`;
    }

    if (creative.ecommerce_scores) {
      emailHtmlContent += `
          <h4 style=\"margin-top: 20px;\">E-commerce Product Showcase Scores (1-5 Scale)</h4>`;

      for (const [param, score] of Object.entries(creative.ecommerce_scores)) {
        const badgeClass = score >= 4 ? 'score-green' : score === 3 ? 'score-yellow' : 'score-red';
        emailHtmlContent += `
          <div class=\"score-item\">
            <span class=\"param\">${param}</span>
            <span class=\"score-badge ${badgeClass}\">${score}/5</span>
          </div>`;
      }
    }

    emailHtmlContent += `
        </div>
      </div>

      <div class=\"section\">
        <h3>Detailed Feedback</h3>

        <div class=\"feedback-box strengths\">
          <h4>✓ Strengths</h4>
          <ul>`;

    creative.strengths.forEach((strength: string) => {
      emailHtmlContent += `
            <li>${strength}</li>`;
    });

    emailHtmlContent += `
          </ul>
        </div>

        <div class=\"feedback-box risks\">
          <h4>⚠ Risks</h4>
          <ul>`;

    creative.risks.forEach((risk: string) => {
      emailHtmlContent += `
            <li>${risk}</li>`;
    });

    emailHtmlContent += `
          </ul>
        </div>

        <div class=\"feedback-box recommendations\">
          <h4>💡 Recommendations</h4>
          <ul>`;

    creative.recommendations.forEach((rec: string) => {
      emailHtmlContent += `
            <li>${rec}</li>`;
    });

    emailHtmlContent += `
          </ul>
        </div>
      </div>`;

    if (additionalComments) {
      emailHtmlContent += `
      <div class=\"comments\">
        <h4>📝 Additional Comments</h4>
        <p>${additionalComments}</p>
      </div>`;
    }

    emailHtmlContent += `
    </div>

    <div class=\"footer\">
      <p>Generated by Psalia Creative Evaluator</p>
      <p>${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
    </div>
  </div>
</body>
</html>`;

    console.log('Preparing to send emails to:', emails);

    const emailRequests = emails.map(email => ({
      personalizations: [
        {
          to: [{ email: email.trim() }],
          subject: `Creative Feedback Report: ${creative.filename}`,
        },
      ],
      from: {
        email: "assistant@psalia.ai",
        name: "Psalia Creative Evaluator",
      },
      content: [
        {
          type: "text/html",
          value: emailHtmlContent,
        },
      ],
    }));

    console.log('Sending emails via SendGrid...');

    const sendPromises = emailRequests.map(emailData =>
      fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sendgridApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(emailData),
      })
    );

    const results = await Promise.all(sendPromises);

    console.log('Email send results:', results.map(r => ({ status: r.status, ok: r.ok })));

    const failedResults = results.filter(res => !res.ok);

    if (failedResults.length > 0) {
      const errorDetails = await Promise.all(
        failedResults.map(async res => {
          try {
            const text = await res.text();
            return `Status ${res.status}: ${text}`;
          } catch {
            return `Status ${res.status}: Unable to parse error`;
          }
        })
      );
      console.error('Failed emails:', errorDetails);
      throw new Error(`Failed to send ${failedResults.length} email(s). Details: ${errorDetails.join('; ')}`);
    }

    console.log('All emails sent successfully');

    return new Response(
      JSON.stringify({ success: true, message: "Feedback sent successfully to all recipients" }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error sending feedback:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
        details: error instanceof Error ? error.stack : undefined
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

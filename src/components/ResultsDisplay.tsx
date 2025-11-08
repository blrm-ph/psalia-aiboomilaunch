import { useState, useEffect } from 'react';
import { Download, CheckCircle, Mail, BarChart3, Check, X } from 'lucide-react';
import { saveApprovalState, loadApprovalStates } from '../utils/approvals';

interface CreativeResult {
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

interface ResultsData {
  executive_summary: string;
  comparison_table?: string;
  creatives: CreativeResult[];
  csv_data?: string;
}

interface ResultsDisplayProps {
  results: ResultsData | null;
}

export default function ResultsDisplay({ results }: ResultsDisplayProps) {
  const [approvedCreatives, setApprovedCreatives] = useState<Set<number>>(new Set());
  const [creativeFeedback, setCreativeFeedback] = useState<{
    [key: number]: string;
  }>({});
  const [bulkFeedbackForm, setBulkFeedbackForm] = useState({
    show: false,
    emails: '',
    sending: false
  });
  const [isLoadingApprovals, setIsLoadingApprovals] = useState(true);
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);

  useEffect(() => {
    if (results?.creatives) {
      loadApprovalStates(results.creatives).then(approvalMap => {
        const approvedSet = new Set<number>();
        approvalMap.forEach((isApproved, index) => {
          if (isApproved) {
            approvedSet.add(index);
          }
        });
        setApprovedCreatives(approvedSet);
        setIsLoadingApprovals(false);
      });
    }
  }, [results]);

  if (!results) return null;

  const handleDownloadCSV = () => {
    if (!results.csv_data) return;

    try {
      const csvContent = atob(results.csv_data);
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `creative-scores-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading CSV:', error);
    }
  };

  const getScoreBadgeColor = (score: number, maxScore: number = 5) => {
    if (score >= 4) return 'bg-green-100 text-green-800 border-green-300';
    if (score === 3) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-red-100 text-red-800 border-red-300';
  };

  const handleApprove = async (index: number) => {
    const creative = results.creatives[index];
    const isCurrentlyApproved = approvedCreatives.has(index);
    const newApprovalState = !isCurrentlyApproved;

    setApprovedCreatives(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });

    await saveApprovalState(
      creative.filename,
      creative.imageData,
      newApprovalState
    );
  };

  const updateCreativeFeedback = (index: number, value: string) => {
    setCreativeFeedback(prev => ({
      ...prev,
      [index]: value
    }));
  };

  const toggleBulkFeedbackForm = () => {
    setBulkFeedbackForm(prev => ({
      ...prev,
      show: !prev.show
    }));
  };

  const handleSendBulkFeedback = async () => {
    if (!bulkFeedbackForm.emails.trim()) {
      alert('Please enter at least one email address');
      return;
    }

    const emailList = bulkFeedbackForm.emails.split(',').map(e => e.trim()).filter(e => e);
    if (emailList.length === 0) {
      alert('Please enter valid email addresses');
      return;
    }

    setBulkFeedbackForm(prev => ({ ...prev, sending: true }));

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      console.log('Sending bulk feedback for all creatives');

      const sendPromises = results.creatives.map(async (creative, index) => {
        const response = await fetch(`${supabaseUrl}/functions/v1/send-feedback`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            creative: creative,
            creativeImage: creative.imageData,
            additionalComments: creativeFeedback[index] || '',
            emails: emailList
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to send feedback');
        }

        return response.json();
      });

      await Promise.all(sendPromises);

      alert(`Feedback sent successfully to all recipients for ${results.creatives.length} creative(s)!`);
      setBulkFeedbackForm({
        show: false,
        emails: '',
        sending: false
      });
    } catch (error) {
      console.error('Error sending bulk feedback:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to send feedback';
      alert(`Error: ${errorMessage}\n\nPlease check the console for more details.`);
      setBulkFeedbackForm(prev => ({ ...prev, sending: false }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-3 mb-3">
          <BarChart3 className="w-6 h-6" />
          <h2 className="text-2xl font-semibold">Analysis</h2>
        </div>
        <p className="text-blue-100 leading-relaxed">
          {results.executive_summary}
        </p>
      </div>

      {results.comparison_table && results.creatives.length >= 2 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            Comparison Overview
          </h3>
          <div className="overflow-x-auto">
            <div className="prose prose-sm max-w-none">
              <div
                dangerouslySetInnerHTML={{
                  __html: parseMarkdownTable(results.comparison_table)
                }}
              />
            </div>
          </div>
        </div>
      )}

      {results.csv_data && (
        <div className="flex justify-end">
          <button
            onClick={handleDownloadCSV}
            className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md"
          >
            <Download className="w-4 h-4" />
            Download Full Report (CSV)
          </button>
        </div>
      )}

      <div className="grid gap-6">
        {results.creatives.map((creative, index) => {
          const maxScore = creative.ecommerce_subtotal !== undefined ? 65 : 40;
          const isApproved = approvedCreatives.has(index);

          return (
            <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-start gap-4">
                  {creative.imageData ? (
                    <img
                      src={creative.imageData}
                      alt={creative.filename}
                      className="w-24 h-24 object-cover rounded-lg border-2 border-gray-300 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => setEnlargedImage(creative.imageData)}
                      onError={(e) => {
                        console.error('Failed to load image:', creative.filename);
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gray-200 rounded-lg border-2 border-gray-300 flex-shrink-0 flex items-center justify-center text-gray-400 text-xs">
                      No Preview
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      {creative.filename}
                    </h3>
                    <div className="flex items-center gap-4">
                      <div className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-lg">
                        {creative.overall_score}/{maxScore}
                      </div>
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Brand: {creative.brand_subtotal}/40</span>
                        {creative.ecommerce_subtotal !== undefined && (
                          <span className="ml-3 font-medium">E-commerce: {creative.ecommerce_subtotal}/25</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                    Brand Expression Scores (1-5 Scale)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {Object.entries(creative.brand_scores).map(([param, score]) => (
                      <div key={param} className={`border rounded-lg p-2 ${getScoreBadgeColor(score)}`}>
                        <div className="text-xs font-medium mb-1">{param}</div>
                        <div className="text-lg font-bold">{score}/5</div>
                      </div>
                    ))}
                  </div>
                </div>

                {creative.ecommerce_scores && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                      E-commerce Product Showcase Scores (1-5 Scale)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {Object.entries(creative.ecommerce_scores).map(([param, score]) => (
                        <div key={param} className={`border rounded-lg p-2 ${getScoreBadgeColor(score)}`}>
                          <div className="text-xs font-medium mb-1">{param}</div>
                          <div className="text-lg font-bold">{score}/5</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Strengths
                    </h4>
                    <ul className="space-y-2">
                      {creative.strengths.map((strength, idx) => (
                        <li key={idx} className="text-sm text-gray-700 pl-3 border-l-2 border-green-500">
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="font-semibold text-red-800 mb-3">
                      Risks
                    </h4>
                    <ul className="space-y-2">
                      {creative.risks.map((risk, idx) => (
                        <li key={idx} className="text-sm text-gray-700 pl-3 border-l-2 border-red-500">
                          {risk}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-800 mb-3">
                      Recommendations
                    </h4>
                    <ul className="space-y-2">
                      {creative.recommendations.map((rec, idx) => (
                        <li key={idx} className="text-sm text-gray-700 pl-3 border-l-2 border-blue-500">
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Feedback for this Creative
                  </label>
                  <textarea
                    value={creativeFeedback[index] || ''}
                    onChange={(e) => updateCreativeFeedback(index, e.target.value)}
                    placeholder="Add any additional comments or feedback specific to this creative..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={3}
                  />
                </div>

                <div className="flex items-center justify-start gap-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleApprove(index)}
                    disabled={isApproved}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-lg transition-colors font-medium ${
                      isApproved
                        ? 'bg-green-100 text-green-800 cursor-not-allowed'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {isApproved ? (
                      <>
                        <Check className="w-4 h-4" />
                        Approved
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Approve
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Share All Feedback</h3>
            <p className="text-sm text-gray-600">Send feedback for all creatives in a single email</p>
          </div>
          <button
            onClick={toggleBulkFeedbackForm}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Mail className="w-4 h-4" />
            {bulkFeedbackForm.show ? 'Cancel' : 'Share All Feedback'}
          </button>
        </div>

        {bulkFeedbackForm.show && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Recipients
              </label>
              <input
                type="text"
                value={bulkFeedbackForm.emails}
                onChange={(e) => setBulkFeedbackForm(prev => ({ ...prev, emails: e.target.value }))}
                placeholder="Enter email addresses separated by commas (e.g., user1@example.com, user2@example.com)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={bulkFeedbackForm.sending}
              />
              <p className="text-xs text-gray-500 mt-1">
                This will send separate emails for each creative with their individual feedback and scores.
              </p>
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleSendBulkFeedback}
                disabled={bulkFeedbackForm.sending}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {bulkFeedbackForm.sending ? 'Sending...' : `Send Feedback for ${results.creatives.length} Creative${results.creatives.length !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        )}
      </div>

      {enlargedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setEnlargedImage(null)}
        >
          <div className="relative max-w-7xl max-h-full">
            <img
              src={enlargedImage}
              alt="Enlarged creative"
              className="max-w-full max-h-screen object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setEnlargedImage(null)}
              className="absolute top-4 right-4 bg-white text-gray-800 rounded-full p-2 hover:bg-gray-100 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function parseMarkdownTable(markdown: string): string {
  const lines = markdown.trim().split('\n');
  if (lines.length < 2) return markdown;

  let html = '<table class="min-w-full divide-y divide-gray-200 border border-gray-300">';

  lines.forEach((line, index) => {
    if (line.includes('---') || line.includes('===')) return;

    const cells = line.split('|').map(cell => cell.trim()).filter(cell => cell);

    if (index === 0) {
      html += '<thead class="bg-gray-50"><tr>';
      cells.forEach(cell => {
        html += `<th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">${cell}</th>`;
      });
      html += '</tr></thead><tbody class="bg-white divide-y divide-gray-200">';
    } else {
      html += '<tr>';
      cells.forEach(cell => {
        html += `<td class="px-4 py-3 text-sm text-gray-700">${cell}</td>`;
      });
      html += '</tr>';
    }
  });

  html += '</tbody></table>';
  return html;
}

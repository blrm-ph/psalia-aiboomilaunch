import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import AuthFlow from './components/AuthFlow';
import BIPManager from './components/BIPManager';
import CreativeUploader from './components/CreativeUploader';
import ResultsDisplay from './components/ResultsDisplay';
import { Creative, ResultsData } from './types';
import { scoreCreatives } from './utils/api';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authenticatedEmail, setAuthenticatedEmail] = useState('');
  const [bip, setBip] = useState('');
  const [results, setResults] = useState<ResultsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedEmail = sessionStorage.getItem('authenticated_email');
    if (storedEmail) {
      setIsAuthenticated(true);
      setAuthenticatedEmail(storedEmail);
    }
  }, []);

  const handleBIPSave = (newBip: string) => {
    setBip(newBip);
    setError(null);
  };

  const handleScore = async (creatives: Creative[]) => {
    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      const data = await scoreCreatives(bip, creatives);
      setResults(data);
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while scoring creatives');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthenticated = (email: string) => {
    setIsAuthenticated(true);
    setAuthenticatedEmail(email);
  };

  if (!isAuthenticated) {
    return <AuthFlow onAuthenticated={handleAuthenticated} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <img
              src="/Logo-file.png"
              alt="Brand Creative Evaluator"
              className="w-12 h-12 object-contain"
            />
            <h1 className="text-4xl font-bold text-gray-900">
              Psalia - Creative Asset Evaluator
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            AI-powered evaluation and recommendation saving you time and money.
          </p>
        </header>

        <div className="space-y-6">
          <BIPManager onBIPSave={handleBIPSave} currentBIP={bip} />

          <CreativeUploader
            onScore={handleScore}
            isLoading={isLoading}
            hasBIP={!!bip}
          />

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-red-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-red-800">Error</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {results && <ResultsDisplay results={results} />}
        </div>

        <footer className="mt-12 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
          <p>Powered by OpenAI GPT-4 Vision and Code Interpreter</p>
          <p className="mt-2">
            For feedback about the tool and for feature requests, please write to{' '}
            <a href="mailto:hello@psalia.ai" className="text-blue-600 hover:text-blue-700 underline">
              hello@psalia.ai
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;

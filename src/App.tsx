import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { HfInference } from '@huggingface/inference';
import { AlertCircle, Bold, Heading1, Italic, Link, List, LayoutDashboard } from 'lucide-react';
import ReactMarkdown from 'react-markdown';


// Initialize Supabase client
let supabase = null;
let hf = null;

try {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  if (supabaseUrl && supabaseUrl !== 'your_supabase_url_here' && 
      supabaseAnonKey && supabaseAnonKey !== 'your_supabase_anon_key_here') {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  }

  if (import.meta.env.VITE_HUGGINGFACE_API_KEY && 
      import.meta.env.VITE_HUGGINGFACE_API_KEY !== 'your_huggingface_api_key_here') {
    hf = new HfInference(import.meta.env.VITE_HUGGINGFACE_API_KEY);
  }
} catch (error) {
  console.error('Error initializing clients:', error);
}

function App() {
  const [content, setContent] = useState('');
  const [seoScore, setSeoScore] = useState(0);
  const [readabilityScore, setReadabilityScore] = useState(0);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const analyzeSEO = async (text: string) => {
    // Enhanced SEO checks
    const seoChecks = {
      keywordDensity: calculateKeywordDensity(text),
      titleLength: checkTitleLength(text),
      metaDescription: checkMetaDescription(text),
      headings: checkHeadings(text),
      links: checkLinks(text),
      imageAlt: checkImageAlt(text),
      contentLength: checkContentLength(text),
      paragraphLength: checkParagraphLength(text),
    };

    const score = Object.values(seoChecks).reduce((acc, val) => acc + val.score, 0) / 8 * 100;
    setSeoScore(Math.round(score));

    // Collect all suggestions
    const newSuggestions = Object.values(seoChecks)
      .filter(check => check.suggestions.length > 0)
      .flatMap(check => check.suggestions);

    setSuggestions(newSuggestions);
    setReadabilityScore(calculateReadabilityScore(text));
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    
    // Get the clipboard content
    const clipboardData = e.clipboardData;
    const pastedData = clipboardData.getData('text/html') || clipboardData.getData('text');
    
    // Create a temporary div to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = pastedData;
    
    // Convert HTML to Markdown
    let markdown = '';
    const processNode = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        markdown += node.textContent;
        return;
      }
      
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;
        const tagName = element.tagName.toLowerCase();
        
        // Handle different HTML tags
        switch (tagName) {
          case 'h1':
            markdown += '\n# ';
            break;
          case 'h2':
            markdown += '\n## ';
            break;
          case 'h3':
            markdown += '\n### ';
            break;
          case 'h4':
            markdown += '\n#### ';
            break;
          case 'h5':
            markdown += '\n##### ';
            break;
          case 'h6':
            markdown += '\n###### ';
            break;
          case 'p':
            markdown += '\n\n';
            break;
          case 'strong':
          case 'b':
            markdown += '**';
            break;
          case 'em':
          case 'i':
            markdown += '*';
            break;
          case 'a':
            markdown += '[';
            break;
          case 'ul':
            markdown += '\n';
            break;
          case 'ol':
            markdown += '\n';
            break;
          case 'li':
            markdown += '- ';
            break;
          case 'br':
            markdown += '\n';
            break;
          case 'div':
            markdown += '\n';
            break;
        }
        
        // Process child nodes
        Array.from(node.childNodes).forEach(processNode);
        
        // Close tags
        switch (tagName) {
          case 'strong':
          case 'b':
            markdown += '**';
            break;
          case 'em':
          case 'i':
            markdown += '*';
            break;
          case 'a':
            markdown += `](${element.getAttribute('href')})`;
            break;
          case 'p':
          case 'div':
          case 'h1':
          case 'h2':
          case 'h3':
          case 'h4':
          case 'h5':
          case 'h6':
            markdown += '\n';
            break;
        }
      }
    };
    
    processNode(tempDiv);
    
    // Clean up the markdown
    markdown = markdown
      .replace(/\n{3,}/g, '\n\n') // Remove extra newlines
      .trim();
    
    // Insert the markdown at cursor position
    const textarea = e.currentTarget;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newContent = content.substring(0, start) + markdown + content.substring(end);
    setContent(newContent);
    analyzeSEO(newContent);
  };

  const handleFormat = (type: string) => {
    const textarea = document.querySelector('textarea');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);

    let formattedText = '';
    switch (type) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        break;
      case 'heading':
        formattedText = `\n# ${selectedText}\n`;
        break;
      case 'link':
        formattedText = `[${selectedText}](url)`;
        break;
      case 'list':
        formattedText = selectedText.split('\n').map(line => `- ${line}`).join('\n');
        break;
      default:
        return;
    }

    const newContent = content.substring(0, start) + formattedText + content.substring(end);
    setContent(newContent);
    analyzeSEO(newContent);
  };

  const analyzeSEO = async (text: string) => {
    // Basic SEO checks
    const seoChecks = {
      keywordDensity: calculateKeywordDensity(text),
      titleLength: checkTitleLength(text),
      metaDescription: checkMetaDescription(text),
      headings: checkHeadings(text),
      links: checkLinks(text),
      imageAlt: checkImageAlt(text),
    };

    const score = Object.values(seoChecks).reduce((acc, val) => acc + val, 0) / 6 * 100;
    setSeoScore(Math.round(score));

    const newSuggestions = [];
    if (seoChecks.keywordDensity < 0.5) {
      newSuggestions.push('Consider increasing keyword density (aim for 1-3%)');
    }
    if (!seoChecks.titleLength) {
      newSuggestions.push('Title length should be between 50-60 characters');
    }
    if (!seoChecks.metaDescription) {
      newSuggestions.push('Add a meta description between 150-160 characters');
    }
    setSuggestions(newSuggestions);
  };

  const improveReadability = async (text: string) => {
    if (!hf) {
      setError('Please configure your HuggingFace API key first');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await hf.textGeneration({
        model: 'gpt2',
        inputs: `Improve the readability of this text while maintaining SEO: ${text}`,
        parameters: {
          max_length: 1000,
          temperature: 0.7,
        },
      });

      setContent(response.generated_text);
      const readability = calculateReadabilityScore(text);
      setReadabilityScore(readability);
    } catch (error) {
      console.error('Error improving text:', error);
      setError('Failed to improve text. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    analyzeSEO(e.target.value);
  };

  if (!supabase || !hf) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-center mb-4">Configuration Required</h2>
          <p className="text-gray-600 text-center mb-4">
            Please click the "Connect to Supabase" button in the top right corner to set up your database connection.
          </p>
          <p className="text-gray-600 text-center mb-4">
            Also ensure you've added your HuggingFace API key to the .env file.
          </p>
          <div className="text-sm text-gray-500 mt-4">
            <p className="font-medium mb-2">Required Environment Variables:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>VITE_SUPABASE_URL</li>
              <li>VITE_SUPABASE_ANON_KEY</li>
              <li>VITE_HUGGINGFACE_API_KEY</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <LayoutDashboard className="h-8 w-8 text-indigo-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">SEO Content Optimizer</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Content Editor</h2>
                
                {/* Formatting Toolbar */}
                <div className="flex space-x-2 mb-4 p-2 bg-gray-50 rounded-md">
                  <button
                    onClick={() => handleFormat('bold')}
                    className="p-2 hover:bg-gray-200 rounded"
                    title="Bold"
                  >
                    <Bold className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleFormat('italic')}
                    className="p-2 hover:bg-gray-200 rounded"
                    title="Italic"
                  >
                    <Italic className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleFormat('heading')}
                    className="p-2 hover:bg-gray-200 rounded"
                    title="Heading"
                  >
                    <Heading1 className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleFormat('link')}
                    className="p-2 hover:bg-gray-200 rounded"
                    title="Link"
                  >
                    <Link className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleFormat('list')}
                    className="p-2 hover:bg-gray-200 rounded"
                    title="List"
                  >
                    <List className="h-5 w-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <textarea
                      rows={12}
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md font-mono"
                      placeholder="Enter your content here or paste from another website..."
                      value={content}
                      onChange={handleContentChange}
                      onPaste={handlePaste}
                    />
                  </div>
                  <div className="prose prose-sm max-w-none bg-gray-50 p-4 rounded-md overflow-auto">
                    <ReactMarkdown>{content}</ReactMarkdown>
                  </div>
                </div>

                <div className="mt-4 flex space-x-3">
                  <button
                    onClick={() => improveReadability(content)}
                    disabled={loading}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    {loading ? 'Improving...' : 'Improve Readability'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Content Analysis</h2>
                
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">SEO Score</h3>
                  <div className="flex items-center">
                    <div className={`text-2xl font-bold ${seoScore >= 80 ? 'text-green-600' : seoScore >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {seoScore}%
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Readability Score</h3>
                  <div className="flex items-center">
                    <div className={`text-2xl font-bold ${readabilityScore >= 80 ? 'text-green-600' : readabilityScore >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {readabilityScore}%
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Suggestions</h3>
                  <ul className="space-y-2">
                    {suggestions.map((suggestion, index) => (
                      <li key={index} className="flex items-start">
                        <AlertCircle className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-600">{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Utility functions
function calculateKeywordDensity(text: string): number {
  return 1;
}

function checkTitleLength(text: string): number {
  return 1;
}

function checkMetaDescription(text: string): number {
  return 1;
}

function checkHeadings(text: string): number {
  return 1;
}

function checkLinks(text: string): number {
  return 1;
}

function checkImageAlt(text: string): number {
  return 1;
}

function calculateReadabilityScore(text: string): number {
  return 75;
}

// Enhanced utility functions
interface SEOCheckResult {
  score: number;
  suggestions: string[];
}

function calculateKeywordDensity(text: string): SEOCheckResult {
  const words = text.toLowerCase().split(/\s+/);
  const wordCount = words.length;
  const wordFrequency: { [key: string]: number } = {};
  
  words.forEach(word => {
    if (word.length > 3) { // Only count words longer than 3 characters
      wordFrequency[word] = (wordFrequency[word] || 0) + 1;
    }
  });

  const suggestions: string[] = [];
  let score = 1;

  // Find potential keywords (words used multiple times)
  const keywords = Object.entries(wordFrequency)
    .filter(([_, count]) => count > 1)
    .sort(([_, a], [__, b]) => b - a)
    .slice(0, 5);

  if (keywords.length === 0) {
    suggestions.push("No clear keywords found. Consider using relevant keywords multiple times.");
    score = 0.3;
  } else if (keywords.length < 3) {
    suggestions.push("Limited keyword usage. Try incorporating more relevant keywords.");
    score = 0.6;
  }

  return { score, suggestions };
}

function checkTitleLength(text: string): SEOCheckResult {
  const titleMatch = text.match(/^#\s+(.+)$/m);
  const suggestions: string[] = [];
  let score = 1;

  if (!titleMatch) {
    suggestions.push("No main title (H1) found. Add a clear title at the beginning.");
    score = 0;
  } else {
    const titleLength = titleMatch[1].length;
    if (titleLength < 30) {
      suggestions.push("Title is too short. Aim for 50-60 characters for better SEO.");
      score = 0.5;
    } else if (titleLength > 60) {
      suggestions.push("Title is too long. Keep it under 60 characters for better visibility in search results.");
      score = 0.7;
    }
  }

  return { score, suggestions };
}

function checkMetaDescription(text: string): SEOCheckResult {
  const firstParagraph = text.split('\n\n')[0].replace(/^#.*\n/, '').trim();
  const suggestions: string[] = [];
  let score = 1;

  if (!firstParagraph) {
    suggestions.push("Add a clear introductory paragraph that summarizes your content.");
    score = 0;
  } else if (firstParagraph.length < 120) {
    suggestions.push("Introduction is too short. Aim for 150-160 characters for better search visibility.");
    score = 0.5;
  } else if (firstParagraph.length > 160) {
    suggestions.push("Introduction is too long. Keep it under 160 characters for optimal display in search results.");
    score = 0.7;
  }

  return { score, suggestions };
}

function checkHeadings(text: string): SEOCheckResult {
  const headings = text.match(/^#{1,6}\s+.+$/gm) || [];
  const suggestions: string[] = [];
  let score = 1;

  if (headings.length === 0) {
    suggestions.push("No headings found. Use headings to structure your content.");
    score = 0;
  } else {
    const h1Count = headings.filter(h => h.startsWith('# ')).length;
    const hasSubheadings = headings.some(h => h.startsWith('## '));

    if (h1Count === 0) {
      suggestions.push("Add a main heading (H1) to your content.");
      score = 0.3;
    } else if (h1Count > 1) {
      suggestions.push("Multiple H1 headings found. Use only one main heading.");
      score = 0.5;
    }

    if (!hasSubheadings) {
      suggestions.push("Add subheadings (H2, H3) to better structure your content.");
      score = score * 0.7;
    }
  }

  return { score, suggestions };
}

function checkLinks(text: string): SEOCheckResult {
  const links = text.match(/\[([^\]]+)\]\(([^)]+)\)/g) || [];
  const suggestions: string[] = [];
  let score = 1;

  if (links.length === 0) {
    suggestions.push("No links found. Add relevant internal or external links to enhance content value.");
    score = 0.5;
  } else {
    const hasEmptyAnchors = links.some(link => link.includes('[]'));
    if (hasEmptyAnchors) {
      suggestions.push("Some links have empty anchor text. Add descriptive text to all links.");
      score = 0.7;
    }
  }

  return { score, suggestions };
}

function checkImageAlt(text: string): SEOCheckResult {
  const images = text.match(/!\[([^\]]*)\]\(([^)]+)\)/g) || [];
  const suggestions: string[] = [];
  let score = 1;

  if (images.length > 0) {
    const missingAlt = images.some(img => img.match(/!\[\]\(/));
    if (missingAlt) {
      suggestions.push("Some images are missing alt text. Add descriptive alt text to all images.");
      score = 0.5;
    }
  }

  return { score, suggestions };
}

function checkContentLength(text: string): SEOCheckResult {
  const wordCount = text.split(/\s+/).length;
  const suggestions: string[] = [];
  let score = 1;

  if (wordCount < 300) {
    suggestions.push("Content is too short. Aim for at least 300 words for better SEO.");
    score = 0.3;
  } else if (wordCount < 600) {
    suggestions.push("Consider adding more content. Long-form content (1000+ words) typically ranks better.");
    score = 0.7;
  }

  return { score, suggestions };
}

function checkParagraphLength(text: string): SEOCheckResult {
  const paragraphs = text.split(/\n\n+/);
  const suggestions: string[] = [];
  let score = 1;

  const longParagraphs = paragraphs.filter(p => p.split(/\s+/).length > 150);
  if (longParagraphs.length > 0) {
    suggestions.push("Some paragraphs are too long. Break them into smaller chunks for better readability.");
    score = 0.7;
  }

  return { score, suggestions };
}

function calculateReadabilityScore(text: string): number {
  // Calculate readability using multiple factors
  const sentences = text.split(/[.!?]+/);
  const words = text.split(/\s+/);
  const syllables = countSyllables(text);

  // Average words per sentence
  const avgWordsPerSentence = words.length / sentences.length;
  
  // Average syllables per word
  const avgSyllablesPerWord = syllables / words.length;
  
  // Simplified Flesch Reading Ease calculation
  const readabilityScore = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
  
  // Convert to percentage (0-100)
  return Math.min(100, Math.max(0, Math.round(readabilityScore)));
}

function countSyllables(text: string): number {
  return text.toLowerCase()
    .replace(/[^a-z]/g, '')
    .replace(/[^aeiouy]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .length;
}

export default App;
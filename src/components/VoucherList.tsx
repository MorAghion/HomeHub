import { useState } from 'react';
import { useTranslation } from 'react-i18next';
// tesseract.js is imported dynamically at point-of-use to keep it out of the initial bundle.
import type { VoucherItem, Voucher, Reservation } from '../types/base';
import VoucherCard from './VoucherCard';
import ConfirmationModal from './ConfirmationModal';
import { VOUCHER_TEMPLATES } from '../utils/voucherMemory';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabaseClient';

interface VoucherListProps {
  listName: string;
  listId: string;
  vouchers: VoucherItem[];
  onUpdateVouchers: (vouchers: VoucherItem[]) => void;
  onBack: () => void;
  autoOpenAdd?: boolean; // fe-bug-010: open add form immediately on mount (after template creation)
}

function VoucherList({ listName, listId, vouchers, onUpdateVouchers, onBack, autoOpenAdd = false }: VoucherListProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(autoOpenAdd);
  const [editingVoucher, setEditingVoucher] = useState<VoucherItem | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [smartPaste, setSmartPaste] = useState('');
  const [imageSize, setImageSize] = useState<string>('');
  const [isScraping, setIsScraping] = useState(false);
  const [showManualFillPrompt, setShowManualFillPrompt] = useState(false);
  const [extractionResults, setExtractionResults] = useState<string[]>([]);

  const { profile } = useAuth();
  const { t } = useTranslation('vouchers');

  // Detect sub-hub type for specialized UI
  const isBuyMe = listId.includes('buyme');
  const isOntopo = listId.includes('ontopo');
  const isPhysical = listId.includes('physical');
  const prioritizeSmartPaste = isBuyMe || isOntopo;

  // Determine default item type from template (always use template as source of truth)
  const getDefaultType = (): 'voucher' | 'reservation' => {
    const templateId = listId.split('_')[1]; // Extract template from "vouchers_[template]"
    const template = VOUCHER_TEMPLATES.find(t => t.id === templateId);

    console.log('getDefaultType called:', { listId, templateId, template, defaultType: template?.defaultType });

    // Always prioritize template definition over stored list defaultType
    if (template?.defaultType !== undefined) {
      return template.defaultType;
    }

    // Fallback to voucher if template not found or has no default
    return 'voucher';
  };

  // Form state
  const [formData, setFormData] = useState<{
    itemType: 'voucher' | 'reservation';
    name: string;
    value: string;
    issuer: string;
    expiryDate: string;
    code: string;
    imageUrl: string;
    notes: string;
    eventDate: string;
    time: string;
    address: string;
  }>({
    itemType: getDefaultType(),
    name: '',
    value: '',
    issuer: '',
    expiryDate: '',
    code: '',
    imageUrl: '',
    notes: '',
    eventDate: '',
    time: '',
    address: ''
  });

  // Web Scraping Logic for ANY URL
  const scrapeReservationDetails = async (url: string, issuer: string) => {
    setIsScraping(true);
    console.log('🕷️ Web Scraping Attempt:', {
      url,
      issuer,
      strategy: issuer === 'Ontopo' ? 'API + HTML' : 'HTML only'
    });

    try {
      // For Ontopo, try API endpoint first
      if (issuer === 'Ontopo' && url.includes('/ticket/')) {
        const ticketId = url.split('/ticket/')[1]?.split('?')[0];
        if (ticketId) {
          console.log('Extracted ticket ID:', ticketId);

          // Try common API patterns
          const apiEndpoints = [
            `https://ontopo.com/api/ticket/${ticketId}`,
            `https://ontopo.com/api/v1/ticket/${ticketId}`,
            `https://ontopo.com/api/reservations/${ticketId}`,
            `https://api.ontopo.com/ticket/${ticketId}`
          ];

          for (const apiUrl of apiEndpoints) {
            try {
              console.log('Trying API:', apiUrl);
              const response = await fetch(apiUrl);
              if (response.ok) {
                const data = await response.json();
                console.log('API response:', data);

                // Extract from API response
                if (data) {
                  const apiName = data.restaurant?.name || data.venue?.name || data.restaurantName || '';
                  const apiDate = data.date || data.reservationDate || data.eventDate || '';
                  const apiTime = data.time || data.reservationTime || '';
                  const apiAddress = data.restaurant?.address || data.venue?.address || data.address || '';

                  if (apiName || apiDate || apiTime || apiAddress) {
                    console.log('Successfully extracted from API!');
                    setFormData(prev => ({
                      ...prev,
                      ...(apiName && { name: apiName }),
                      ...(apiDate && prev.itemType === 'reservation' && { eventDate: apiDate }),
                      ...(apiTime && prev.itemType === 'reservation' && { time: apiTime }),
                      ...(apiAddress && prev.itemType === 'reservation' && { address: apiAddress })
                    }));

                    setIsScraping(false);
                    alert(`✅ Details fetched from API!\n\nExtracted: ${[apiName && 'Name', apiDate && 'Date', apiTime && 'Time', apiAddress && 'Address'].filter(Boolean).join(', ')}`);
                    return;
                  }
                }
              }
            } catch (apiError) {
              console.log('API endpoint failed:', apiUrl);
            }
          }
        }
      }

      // Fallback to HTML scraping
      console.log('API fetch failed, falling back to HTML scraping...');

      // Try direct fetch first (will fail if CORS is not enabled)
      let html = '';
      try {
        const response = await fetch(url);
        html = await response.text();
      } catch (corsError) {
        console.log('Direct fetch blocked by CORS, trying proxy...');

        // Try with CORS proxy (public service - use with caution in production)
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
        const response = await fetch(proxyUrl);
        const data = await response.json();
        html = data.contents;
      }

      console.log('HTML fetched, length:', html.length);

      // Log first 500 chars for debugging
      console.log('HTML preview:', html.substring(0, 500));

      // Parse HTML to extract details
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      let extractedName = '';
      let extractedDate = '';
      let extractedTime = '';
      let extractedAddress = '';

      if (issuer === 'Ontopo') {
        // First, try to extract from meta tags (most reliable for dynamic sites)
        const metaTags = {
          title: doc.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
                 doc.querySelector('meta[name="twitter:title"]')?.getAttribute('content') ||
                 doc.querySelector('title')?.textContent,
          description: doc.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
                      doc.querySelector('meta[name="description"]')?.getAttribute('content'),
          siteName: doc.querySelector('meta[property="og:site_name"]')?.getAttribute('content'),
          image: doc.querySelector('meta[property="og:image"]')?.getAttribute('content')
        };

        console.log('Meta tags found:', metaTags);

        // Extract name from meta tags
        if (metaTags.title) {
          // Clean up title (remove site name, etc.)
          extractedName = metaTags.title
            .replace(/\s*[-|]\s*(Ontopo|אונטופו).*/i, '')
            .replace(/הזמנה ב/, '')
            .replace(/Reservation at/i, '')
            .trim();

          if (extractedName) {
            console.log('Name extracted from meta:', extractedName);
          }
        }

        // Try to extract from description
        if (metaTags.description) {
          console.log('Description:', metaTags.description);

          // Look for date patterns in description
          const dateMatch = metaTags.description.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/);
          if (dateMatch) {
            const day = dateMatch[1].padStart(2, '0');
            const month = dateMatch[2].padStart(2, '0');
            const year = dateMatch[3].length === 2 ? `20${dateMatch[3]}` : dateMatch[3];
            extractedDate = `${year}-${month}-${day}`;
            console.log('Date from description:', extractedDate);
          }

          // Look for time patterns
          const timeMatch = metaTags.description.match(/(\d{1,2}):(\d{2})/);
          if (timeMatch) {
            extractedTime = `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`;
            console.log('Time from description:', extractedTime);
          }
        }

        // If no name yet, try HTML selectors
        if (!extractedName) {
          const titleSelectors = [
            'h1',
            'h2',
            '.restaurant-name',
            '[class*="restaurant"]',
            '[class*="venue"]',
            '[class*="title"]'
          ];

          for (const selector of titleSelectors) {
            const element = doc.querySelector(selector);
            if (element) {
              extractedName = element.textContent?.trim() || '';
              if (extractedName && extractedName.length > 2) {
                console.log('Name found via selector:', selector, extractedName);
                break;
              }
            }
          }
        }

        // Extract date and time
        const dateSelectors = [
          '[class*="date"]',
          '[class*="time"]',
          '[datetime]',
          'time'
        ];

        for (const selector of dateSelectors) {
          const elements = doc.querySelectorAll(selector);
          elements.forEach(element => {
            const text = element.textContent?.trim() || '';
            const datetime = element.getAttribute('datetime');

            if (datetime) {
              // Parse ISO datetime
              const date = new Date(datetime);
              if (!isNaN(date.getTime())) {
                extractedDate = date.toISOString().split('T')[0];
                extractedTime = date.toTimeString().slice(0, 5);
                console.log('Date/Time from datetime attr:', extractedDate, extractedTime);
              }
            } else if (text) {
              // Try to parse from text
              const dateMatch = text.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/);
              const timeMatch = text.match(/(\d{1,2}):(\d{2})/);

              if (dateMatch && !extractedDate) {
                const day = dateMatch[1].padStart(2, '0');
                const month = dateMatch[2].padStart(2, '0');
                const year = dateMatch[3].length === 2 ? `20${dateMatch[3]}` : dateMatch[3];
                extractedDate = `${year}-${month}-${day}`;
                console.log('Date from text:', extractedDate);
              }

              if (timeMatch && !extractedTime) {
                extractedTime = `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`;
                console.log('Time from text:', extractedTime);
              }
            }
          });
        }

        // Extract address
        const addressSelectors = [
          '[class*="address"]',
          '[class*="location"]',
          'address',
          '[itemprop="address"]',
          'meta[property="og:street-address"]'
        ];

        for (const selector of addressSelectors) {
          const element = doc.querySelector(selector);
          if (element) {
            extractedAddress = element.textContent?.trim() ||
                              (element as HTMLMetaElement).content?.trim() || '';
            if (extractedAddress) {
              console.log('Address found:', extractedAddress);
              break;
            }
          }
        }

        // Look for structured data (JSON-LD)
        const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
        scripts.forEach(script => {
          try {
            const data = JSON.parse(script.textContent || '');
            console.log('JSON-LD found:', data);

            if (data['@type'] === 'FoodEstablishment' || data['@type'] === 'Restaurant') {
              extractedName = extractedName || data.name || '';
              extractedAddress = extractedAddress || data.address?.streetAddress || '';
            }
            if (data['@type'] === 'Event' || data['@type'] === 'Reservation') {
              extractedDate = extractedDate || data.startDate?.split('T')[0] || '';
              extractedTime = extractedTime || data.startDate?.split('T')[1]?.slice(0, 5) || '';
            }
          } catch (e) {
            // Invalid JSON, skip
          }
        });

        // Look for any JavaScript variables with reservation data
        const allScripts = doc.querySelectorAll('script:not([src])');
        allScripts.forEach(script => {
          const content = script.textContent || '';

          // Look for common data patterns
          if (content.includes('reservation') || content.includes('booking')) {
            console.log('Found reservation script block');

            // Try to extract data from JS variables
            const dateMatch = content.match(/date["\s:]+["']?(\d{4}-\d{2}-\d{2})/i);
            const timeMatch = content.match(/time["\s:]+["']?(\d{1,2}:\d{2})/i);
            const venueMatch = content.match(/venue["\s:]+["']([^"']+)["']/i) ||
                             content.match(/restaurant["\s:]+["']([^"']+)["']/i);

            if (dateMatch && !extractedDate) {
              extractedDate = dateMatch[1];
              console.log('Date from script:', extractedDate);
            }
            if (timeMatch && !extractedTime) {
              extractedTime = timeMatch[1];
              console.log('Time from script:', extractedTime);
            }
            if (venueMatch && !extractedName) {
              extractedName = venueMatch[1];
              console.log('Venue from script:', extractedName);
            }
          }
        });

        // Try to find React/Vue data attributes
        const rootElements = doc.querySelectorAll('[data-reactroot], #app, #root, [data-v-app]');
        rootElements.forEach(root => {
          const dataAttrs = Array.from(root.attributes).filter(attr =>
            attr.name.startsWith('data-') && attr.value
          );
          if (dataAttrs.length > 0) {
            console.log('Found data attributes:', dataAttrs.map(a => ({ [a.name]: a.value })));
          }
        });
      }

      // Update form with scraped data (preserve itemType!)
      setFormData(prev => {
        console.log('🌐 Scraping update - current type:', prev.itemType);
        return {
          ...prev,
          ...(extractedName && { name: extractedName }),
          ...(extractedDate && prev.itemType === 'reservation' && { eventDate: extractedDate }),
          ...(extractedTime && prev.itemType === 'reservation' && { time: extractedTime }),
          ...(extractedAddress && prev.itemType === 'reservation' && { address: extractedAddress })
        };
      });

      console.log('Scraping completed:', { extractedName, extractedDate, extractedTime, extractedAddress });

      // Show feedback to user
      const extractedFields = [
        extractedName && 'Name',
        extractedDate && 'Date',
        extractedTime && 'Time',
        extractedAddress && 'Address'
      ].filter(Boolean);

      if (extractedFields.length > 0) {
        setExtractionResults(extractedFields);
        setShowManualFillPrompt(true);
      } else {
        // Provide helpful debugging info
        const pageTitle = doc.querySelector('title')?.textContent || 'No title';
        const hasReactRoot = doc.querySelector('[data-reactroot], #app, #root') ? 'Yes' : 'No';

        console.warn('Extraction failed. Page analysis:', {
          pageTitle,
          hasReactRoot,
          htmlLength: html.length
        });

        setExtractionResults([]);
        setShowManualFillPrompt(true);
      }

    } catch (error) {
      console.error('❌ Scraping error:', error);

      // Analyze the error to provide helpful feedback
      let errorReason = 'Unknown error';
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        errorReason = 'CORS blocking or network error';
      } else if (error instanceof SyntaxError) {
        errorReason = 'Invalid response format';
      }

      console.warn('🚫 Scraping failed:', {
        url,
        errorReason,
        suggestion: 'This URL may require authentication, use dynamic rendering, or block automated access'
      });

      // Show manual fill prompt with extracted fields
      const extractedFields = [];
      if (formData.name) extractedFields.push('Name');
      if (formData.code) extractedFields.push('URL');

      setExtractionResults(extractedFields);
      setShowManualFillPrompt(true);
    } finally {
      setIsScraping(false);
    }
  };

  const resetForm = () => {
    setFormData({
      itemType: getDefaultType(),
      name: '',
      value: '',
      issuer: '',
      expiryDate: '',
      code: '',
      imageUrl: '',
      notes: '',
      eventDate: '',
      time: '',
      address: ''
    });
    setSmartPaste('');
    setImageSize('');
  };

  // Smart Paste Logic - Detect URLs and determine type
  const handleSmartPaste = (text: string) => {
    setSmartPaste(text);

    console.log('Smart Paste triggered with text:', text);

    // Detect common voucher/reservation service URLs
    const urlPatterns = {
      buyme: /buyme\.(?:co\.il|com)[^\s]*/i,
      ontopo: /ontopo\.(?:co\.il|com)[^\s]*/i,
      restoya: /restoya\.(?:co\.il|com)[^\s]*/i,
      tenbis: /10bis\.(?:co\.il|com)[^\s]*/i,
      goody: /goody\.(?:co\.il|com)[^\s]*/i,
      wolt: /wolt\.com[^\s]*/i,
      bolt: /bolt\.eu[^\s]*/i,
      uber: /uber\.com[^\s]*/i,
      generic: /(https?:\/\/[^\s]+)/i
    };

    let matchedService = '';
    let matchedUrl = '';

    console.log('🔎 Testing URL patterns against text...');

    // Try to match specific services first
    for (const [service, pattern] of Object.entries(urlPatterns)) {
      if (service === 'generic') continue; // Skip generic for now

      const match = text.match(pattern);
      console.log(`  Testing ${service}:`, match ? `✅ MATCHED "${match[0]}"` : '❌ no match');

      if (match) {
        matchedService = service;
        matchedUrl = match[0];
        console.log(`✅ Final match: ${service} → ${matchedUrl}`);
        break;
      }
    }

    // Fallback to generic URL detection
    if (!matchedUrl) {
      console.log('🔍 No specific service matched, trying generic URL...');
      const genericMatch = text.match(urlPatterns.generic);
      if (genericMatch) {
        matchedUrl = genericMatch[0];
        matchedService = 'generic';
        console.log('✅ Generic URL detected:', matchedUrl);
      } else {
        console.log('❌ No URL detected at all!');
      }
    }

    if (matchedUrl) {
      // Ensure it's a full URL
      const fullUrl = matchedUrl.startsWith('http') ? matchedUrl : `https://${matchedUrl}`;

      // Determine issuer name
      const issuerMap: Record<string, string> = {
        buyme: 'BuyMe',
        ontopo: 'Ontopo',
        restoya: 'Restoya',
        tenbis: '10Bis',
        goody: 'Goody',
        wolt: 'Wolt',
        bolt: 'Bolt',
        uber: 'Uber',
        generic: 'Gift Card'
      };

      const issuer = issuerMap[matchedService] || '';
      let voucherName = '';
      let eventDate = '';
      let eventTime = '';
      let address = '';

      // ALWAYS use template default type (don't let smart detection override it)
      const defaultItemType = getDefaultType();

      console.log('🔍 Type Decision (from template):', {
        matchedService,
        templateType: defaultItemType,
        currentFormType: formData.itemType,
        note: 'Using template default - type detection disabled for predefined lists'
      });

      // Extract voucher name from SMS text
      if (matchedService === 'ontopo' || matchedService === 'restoya') {
        // For Ontopo: Extract restaurant name
        // Pattern: "פרטי הזמנתכם ל[NAME] בקישור" or variations
        const namePatterns = [
          /הזמנתכם\s+ל\s*([^\s]+)\s+בקישור/,  // "הזמנתכם ל[NAME] בקישור" (with or without space after ל)
          /ל\s*([A-Z0-9\u0590-\u05FF]+)\s+בקישור/i,  // "ל[NAME] בקישור" (Hebrew or English, case insensitive)
          /reservation\s+at\s+([^:\s]+)/i,  // "reservation at [NAME]"
          /to\s+([A-Z][a-zA-Z\s]+?)\s+(?:for|on|at)/i,  // "to [NAME] for/on/at"
          /ל\s*([A-Za-z0-9\u0590-\u05FF]+)/  // Fallback: ל followed by any name
        ];

        for (const pattern of namePatterns) {
          const match = text.match(pattern);
          if (match && match[1]) {
            voucherName = match[1].trim();
            console.log('Name extracted:', voucherName, 'using pattern:', pattern);
            break;
          }
        }

        // Fallback: Use "Ontopo Reservation" if no name found
        if (!voucherName) {
          voucherName = 'Ontopo Reservation';
          console.log('No name found, using fallback');
        }

        // Extract date - Common patterns in Hebrew/English
        const datePatterns = [
          /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/,  // DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY
          /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/,  // YYYY-MM-DD
          /(ב)?(\d{1,2})[\s\/\-\.](ב)?(\w+)/,  // Hebrew: "ב-15 במרץ" or "15 מרץ"
        ];

        for (const pattern of datePatterns) {
          const match = text.match(pattern);
          if (match) {
            // Try to convert to ISO format YYYY-MM-DD
            if (match[0].includes('-') && match[1].length === 4) {
              // Already in YYYY-MM-DD format
              eventDate = match[0];
            } else if (match[1] && match[2] && match[3]) {
              // DD/MM/YYYY format - convert to YYYY-MM-DD
              const day = match[1].padStart(2, '0');
              const month = match[2].padStart(2, '0');
              const year = match[3].length === 2 ? `20${match[3]}` : match[3];
              eventDate = `${year}-${month}-${day}`;
            }
            break;
          }
        }

        // Extract time - Common patterns
        const timePatterns = [
          /(\d{1,2}):(\d{2})/,  // HH:MM format
          /בשעה\s*(\d{1,2})[:\.](\d{2})?/,  // Hebrew: "בשעה 19:30"
          /at\s*(\d{1,2})[:\.](\d{2})\s*(AM|PM)?/i  // "at 7:30 PM"
        ];

        for (const pattern of timePatterns) {
          const match = text.match(pattern);
          if (match) {
            let hours = parseInt(match[1]);
            const minutes = match[2] ? match[2].padStart(2, '0') : '00';

            // Handle AM/PM
            if (match[3]) {
              if (match[3].toUpperCase() === 'PM' && hours < 12) hours += 12;
              if (match[3].toUpperCase() === 'AM' && hours === 12) hours = 0;
            }

            eventTime = `${hours.toString().padStart(2, '0')}:${minutes}`;
            break;
          }
        }

        // Extract address - Look for common address patterns
        const addressPatterns = [
          /(?:כתובת|address)[:\s]+([^\n\r]+)/i,  // "כתובת: Street 123"
          /(?:רחוב|st\.|street)\s+([^\n\r,]+(?:,\s*[^\n\r]+)?)/i,  // "רחוב הרצל 25, תל אביב"
        ];

        for (const pattern of addressPatterns) {
          const match = text.match(pattern);
          if (match && match[1]) {
            address = match[1].trim();
            break;
          }
        }
      } else if (['buyme', 'goody', 'tenbis', 'generic'].includes(matchedService)) {
        // For voucher services: Extract gift card/voucher description
        const namePatterns = [
          /gift\s+card\s+(?:from|for)\s+([^.\s]+)/i,
          /([A-Z][a-zA-Z\s]+?)\s+gift\s+card/i,
          /voucher\s+(?:from|for)\s+([^.\s]+)/i,
          /שובר\s+(?:של|ל|מ)?\s*([^\s]+)/i,  // Hebrew: "שובר של/ל/מ [NAME]"
          /כרטיס\s+(?:מתנה|של|ל)?\s*([^\s]+)/i  // Hebrew: "כרטיס מתנה של [NAME]"
        ];

        for (const pattern of namePatterns) {
          const match = text.match(pattern);
          if (match && match[1]) {
            voucherName = match[1].trim();
            break;
          }
        }

        // Fallback: Use issuer name + "Gift Card"
        if (!voucherName) {
          voucherName = `${issuer} Gift Card`;
        }
      } else if (['wolt', 'bolt', 'uber'].includes(matchedService)) {
        // For ride/delivery services: Extract destination or order details
        const namePatterns = [
          /(?:to|pickup from|destination)[:\s]+([^\n\r]+)/i,
          /(?:order|delivery) (?:from|at)[:\s]+([^\n\r]+)/i
        ];

        for (const pattern of namePatterns) {
          const match = text.match(pattern);
          if (match && match[1]) {
            voucherName = match[1].trim();
            break;
          }
        }

        if (!voucherName) {
          voucherName = `${issuer} Booking`;
        }

        // Try to extract date/time from SMS
        const dateMatch = text.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/);
        const timeMatch = text.match(/(\d{1,2}):(\d{2})/);

        if (dateMatch) {
          const day = dateMatch[1].padStart(2, '0');
          const month = dateMatch[2].padStart(2, '0');
          const year = dateMatch[3].length === 2 ? `20${dateMatch[3]}` : dateMatch[3];
          eventDate = `${year}-${month}-${day}`;
        }

        if (timeMatch) {
          eventTime = `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`;
        }
      }

      // Build the updated data based on type
      console.log('📝 Building updatedData:', {
        defaultItemType,
        willSetAsReservation: defaultItemType === 'reservation',
        extractedData: { voucherName, eventDate, eventTime, address }
      });

      const updatedData = defaultItemType === 'reservation'
        ? {
            itemType: 'reservation' as const,
            name: voucherName,
            code: fullUrl,
            issuer,
            eventDate: eventDate || '',
            time: eventTime || '',
            address: address || '',
            // Clear voucher-specific fields
            value: '',
            expiryDate: ''
          }
        : {
            itemType: 'voucher' as const,
            name: voucherName,
            code: fullUrl,
            issuer,
            value: '',
            expiryDate: '',
            // Clear reservation-specific fields
            eventDate: '',
            time: '',
            address: ''
          };

      console.log('✅ SMS parsing completed:', updatedData);
      console.log('📊 State transition:', {
        from: formData.itemType,
        to: updatedData.itemType,
        shouldShowReservationFields: updatedData.itemType === 'reservation'
      });

      setFormData(prev => {
        const newData = {
          ...prev,
          ...updatedData
        };
        console.log('FormData updated to:', newData);
        return newData;
      });

      // Attempt to scrape additional details from ANY URL
      if (fullUrl) {
        console.log('🌐 Initiating web scrape for:', fullUrl);
        setTimeout(() => scrapeReservationDetails(fullUrl, issuer || 'Unknown'), 500);
      }
    } else {
      console.log('No voucher/reservation URL detected in text');
    }
  };

  // Image Upload and OCR Logic
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const originalSizeKB = (file.size / 1024).toFixed(1);

    // Check file size (warn if > 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      const shouldContinue = window.confirm(
        `Image size is ${(file.size / 1024 / 1024).toFixed(1)}MB. Large images may impact performance. Continue?`
      );
      if (!shouldContinue) {
        setImageSize('');
        return;
      }
    }

    // Convert to base64 with compression
    const reader = new FileReader();
    reader.onloadend = async () => {
      let base64 = reader.result as string;
      let wasCompressed = false;

      // Compress image if too large
      if (file.size > 500 * 1024) { // If > 500KB, compress
        base64 = await compressImage(base64, 0.7); // 70% quality
        wasCompressed = true;
      }

      // Calculate compressed size
      const compressedSizeKB = ((base64.length * 3) / 4 / 1024).toFixed(1);
      setImageSize(wasCompressed ? `${originalSizeKB}KB → ${compressedSizeKB}KB (compressed)` : `${originalSizeKB}KB`);

      // Show base64 as immediate preview while storage upload happens in the background
      setFormData(prev => ({ ...prev, imageUrl: base64 }));

      // Upload to Supabase Storage in background; replace base64 with a signed URL on success
      if (profile) {
        setIsUploading(true);
        const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const storagePath = `${profile.household_id}/${listId}/${Date.now()}.${ext}`;
        supabase.storage
          .from('voucher-images')
          .upload(storagePath, file, { contentType: file.type })
          .then(async ({ error: uploadError }) => {
            if (uploadError) throw uploadError;
            const { data: signedData, error: signedError } = await supabase.storage
              .from('voucher-images')
              .createSignedUrl(storagePath, 315_360_000); // ~10 years
            if (signedError || !signedData?.signedUrl) throw signedError ?? new Error('No signed URL');
            setFormData(prev => ({ ...prev, imageUrl: signedData.signedUrl }));
          })
          .catch(err => console.error('Storage upload failed, keeping base64 fallback:', err))
          .finally(() => setIsUploading(false));
      }

      // Perform OCR with Hebrew + English support
      setIsScanning(true);
      try {
        console.log('📸 Starting OCR with Hebrew + English support...');
        const { default: Tesseract } = await import('tesseract.js');
        const { data: { text } } = await Tesseract.recognize(
          base64,
          'heb+eng', // Support both Hebrew and English
          {
            logger: () => {} // Suppress logs
          }
        );

        console.log('📝 OCR extracted text:', text);

        // Extract ALL codes/digits (6+ digits each)
        const digitMatches = text.match(/\d{6,}/g);
        if (digitMatches && digitMatches.length > 0) {
          const allCodes = digitMatches.length > 1
            ? digitMatches.join(' / ')
            : digitMatches[0];

          console.log(`📱 OCR extracted ${digitMatches.length} code(s):`, digitMatches);

          setFormData(prev => ({
            ...prev,
            code: allCodes
          }));
        }

        // Extract URLs from OCR text (handle multi-line URLs and spaces within URLs)
        // First, clean up the text: remove RTL/LTR marks and join lines
        const cleanedText = text
          .replace(/[‏‎\u200E\u200F]/g, '') // Remove RTL/LTR marks
          .replace(/\n\s*/g, ' '); // Replace newlines with spaces

        console.log('🧹 Cleaned OCR text:', cleanedText);

        // Extract URLs - find "https://" or "http://" and capture URL-like text (even with spaces)
        // Pattern: http(s):// followed by URL characters (letters, numbers, dots, slashes, hyphens)
        // Allow spaces between URL parts, then remove them
        const urlPattern = /https?:\/\/\s*[\w\.\-\/]+(?:\s+[\w\.\-\/]+)*/gi;
        const urlMatches = cleanedText.match(urlPattern);

        if (urlMatches && urlMatches.length > 0) {
          // Remove all spaces from the URL
          const extractedUrl = urlMatches[0].replace(/\s+/g, '').trim();
          console.log('🔗 URL extracted from OCR:', extractedUrl);

          setFormData(prev => ({
            ...prev,
            code: extractedUrl
          }));

          // If URL found, trigger SMS paste logic to extract more details
          // Use text with spaces removed from URLs for better parsing
          const cleanedTextForParsing = cleanedText.replace(/https?:\/\/\s*[\w\.\-\/]+(?:\s+[\w\.\-\/]+)*/gi, (match) => match.replace(/\s+/g, ''));
          setTimeout(() => {
            handleSmartPaste(cleanedTextForParsing);
          }, 100);
        }

        // Extract restaurant/venue name from Hebrew text patterns
        const namePatterns = [
          /הזמנתכם\s+ל\s*([^\s\n]+)/,  // "הזמנתכם ל[NAME]"
          /ל\s*([A-Z0-9\u0590-\u05FF]+)\s+בקישור/i,  // "ל[NAME] בקישור"
          /reservation\s+(?:at|for)\s+([^\n\r]+)/i  // "reservation at [NAME]"
        ];

        for (const pattern of namePatterns) {
          const match = text.match(pattern);
          if (match && match[1]) {
            const extractedName = match[1].trim();
            console.log('🏷️ Name extracted from OCR:', extractedName);
            setFormData(prev => ({
              ...prev,
              name: extractedName
            }));
            break;
          }
        }

        // Extract currency values (₪, $, €, etc.)
        const currencyPattern = /[₪$€£¥]\s*\d+(?:[.,]\d+)?|\d+(?:[.,]\d+)?\s*[₪$€£¥]/g;
        const currencyMatches = text.match(currencyPattern);
        if (currencyMatches && currencyMatches.length > 0) {
          console.log('💰 Currency value found:', currencyMatches[0]);
          setFormData(prev => ({
            ...prev,
            value: currencyMatches[0].trim()
          }));
        }

        // Extract dates - works for both vouchers and reservations
        const datePatterns = [
          /(?:exp(?:iry)?|valid until|expires?|date|event)[:\s]*(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/i,
          /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/,
          /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/
        ];

        for (const pattern of datePatterns) {
          const match = text.match(pattern);
          if (match) {
            let extractedDate = '';
            if (match[0].includes('-') && match[1].length === 4) {
              extractedDate = match[0].match(/\d{4}-\d{1,2}-\d{1,2}/)?.[0] || '';
            } else if (match[1] && match[2] && match[3]) {
              const day = match[1].padStart(2, '0');
              const month = match[2].padStart(2, '0');
              const year = match[3].length === 2 ? `20${match[3]}` : match[3];
              extractedDate = `${year}-${month}-${day}`;
            }

            if (extractedDate) {
              console.log('📅 Date extracted:', extractedDate);
              setFormData(prev => ({
                ...prev,
                // Set correct date field based on CURRENT itemType (from prev, not stale formData)
                ...(prev.itemType === 'voucher' ? { expiryDate: extractedDate } : { eventDate: extractedDate })
              }));
              break;
            }
          }
        }

        // Extract time (for reservations)
        const timePatterns = [
          /(\d{1,2}):(\d{2})\s*(AM|PM)?/i,
          /(?:time)[:\s]*(\d{1,2}):(\d{2})/i
        ];

        for (const pattern of timePatterns) {
          const match = text.match(pattern);
          if (match) {
            let hours = parseInt(match[1]);
            const minutes = match[2];

            // Handle AM/PM
            if (match[3]) {
              if (match[3].toUpperCase() === 'PM' && hours < 12) hours += 12;
              if (match[3].toUpperCase() === 'AM' && hours === 12) hours = 0;
            }

            const extractedTime = `${hours.toString().padStart(2, '0')}:${minutes}`;
            console.log('⏰ Time extracted:', extractedTime);

            setFormData(prev => ({
              ...prev,
              // Only set time if it's a reservation
              ...(prev.itemType === 'reservation' ? { time: extractedTime } : {})
            }));
            break;
          }
        }

        // Extract location/address keywords from Hebrew text
        const addressKeywordsHebrew = ['רחוב', 'כתובת', 'מיקום', 'ברחוב'];
        const addressKeywordsEnglish = ['street', 'address', 'location', 'at'];

        const lowerText = text.toLowerCase();
        for (const keyword of [...addressKeywordsHebrew, ...addressKeywordsEnglish]) {
          const idx = lowerText.indexOf(keyword.toLowerCase());
          if (idx !== -1) {
            // Extract text after keyword (up to 50 chars or newline)
            const afterKeyword = text.substring(idx + keyword.length).trim();
            const addressMatch = afterKeyword.match(/^[^\n]{1,50}/);
            if (addressMatch) {
              console.log('📍 Address extracted:', addressMatch[0]);
              setFormData(prev => ({
                ...prev,
                // Only set address if it's a reservation
                ...(prev.itemType === 'reservation' ? { address: addressMatch[0].trim() } : {})
              }));
              break;
            }
          }
        }

        // Show completion message with accuracy warning
        const extractedFields: string[] = [];
        if (urlMatches && urlMatches.length > 0) extractedFields.push('URL');
        if (digitMatches && digitMatches.length > 0) extractedFields.push('Code(s)');
        if (currencyMatches && currencyMatches.length > 0) extractedFields.push('Value');

        if (extractedFields.length > 0) {
          console.log('✅ OCR completed. Extracted:', extractedFields.join(', '));

          // Show user-friendly warning about OCR accuracy
          setTimeout(() => {
            alert(
              `📸 OCR Extraction Complete!\n\n` +
              `Extracted: ${extractedFields.join(', ')}\n\n` +
              `⚠️ Important: OCR may misread similar characters (like d→A, 9→Q).\n\n` +
              `✅ Please verify the URL/codes are correct.\n\n` +
              `💡 Tip: For 100% accuracy, paste SMS text directly instead of using screenshots.`
            );
          }, 500);
        }
      } catch (error) {
        console.error('OCR Error:', error);
      } finally {
        setIsScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Image compression helper
  const compressImage = (base64: string, quality: number): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Calculate new dimensions (max 1200px width)
        const maxWidth = 1200;
        const scaleSize = maxWidth / img.width;
        canvas.width = img.width > maxWidth ? maxWidth : img.width;
        canvas.height = img.width > maxWidth ? img.height * scaleSize : img.height;

        // Draw and compress
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed);
      };
      img.src = base64;
    });
  };

  const handleAddVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const baseItem = {
      id: crypto.randomUUID(),
      name: formData.name.trim(),
      imageUrl: formData.imageUrl.trim() || undefined,
      notes: formData.notes.trim() || undefined,
      code: formData.code.trim() || undefined
    };

    const newItem: VoucherItem = formData.itemType === 'voucher'
      ? {
          ...baseItem,
          itemType: 'voucher',
          value: formData.value.trim() || undefined,
          issuer: formData.issuer.trim() || undefined,
          expiryDate: formData.expiryDate || undefined
        } as Voucher
      : {
          ...baseItem,
          itemType: 'reservation',
          eventDate: formData.eventDate || undefined,
          time: formData.time.trim() || undefined,
          address: formData.address.trim() || undefined
        } as Reservation;

    onUpdateVouchers([...vouchers, newItem]);
    resetForm();
    setIsAddModalOpen(false);
  };

  const handleEditVoucher = (item: VoucherItem) => {
    setEditingVoucher(item);

    if (item.itemType === 'voucher') {
      setFormData({
        itemType: 'voucher',
        name: item.name,
        value: item.value || '',
        issuer: item.issuer || '',
        expiryDate: item.expiryDate || '',
        code: item.code || '',
        imageUrl: item.imageUrl || '',
        notes: item.notes || '',
        eventDate: '',
        time: '',
        address: ''
      });
    } else {
      setFormData({
        itemType: 'reservation',
        name: item.name,
        eventDate: item.eventDate || '',
        time: item.time || '',
        address: item.address || '',
        code: item.code || '',
        imageUrl: item.imageUrl || '',
        notes: item.notes || '',
        value: '',
        issuer: '',
        expiryDate: ''
      });
    }

    setIsAddModalOpen(true);
  };

  const handleUpdateVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !editingVoucher) return;

    const baseUpdate = {
      name: formData.name.trim(),
      imageUrl: formData.imageUrl.trim() || undefined,
      notes: formData.notes.trim() || undefined,
      code: formData.code.trim() || undefined
    };

    const updatedVouchers = vouchers.map(item =>
      item.id === editingVoucher.id
        ? formData.itemType === 'voucher'
          ? {
              ...item,
              ...baseUpdate,
              itemType: 'voucher' as const,
              value: formData.value.trim() || undefined,
              issuer: formData.issuer.trim() || undefined,
              expiryDate: formData.expiryDate || undefined
            } as Voucher
          : {
              ...item,
              ...baseUpdate,
              itemType: 'reservation' as const,
              eventDate: formData.eventDate || undefined,
              time: formData.time.trim() || undefined,
              address: formData.address.trim() || undefined
            } as Reservation
        : item
    );

    onUpdateVouchers(updatedVouchers);
    resetForm();
    setEditingVoucher(null);
    setIsAddModalOpen(false);
  };

  const handleDeleteVoucher = (voucherId: string) => {
    onUpdateVouchers(vouchers.filter(v => v.id !== voucherId));
    setDeleteConfirmation(null);
  };

  const handleRefreshDetails = async (voucher: VoucherItem) => {
    if (!voucher.code) return;

    // Detect if it's a BuyMe or Ontopo URL
    const isBuyMeUrl = voucher.code.toLowerCase().includes('buyme');
    const isOntopoUrl = voucher.code.toLowerCase().includes('ontopo');

    if (!isBuyMeUrl && !isOntopoUrl) {
      alert('Refresh only works for BuyMe or Ontopo URLs');
      return;
    }

    const issuer = isBuyMeUrl ? 'BuyMe' : 'Ontopo';

    // Set form data with current voucher data
    if (voucher.itemType === 'voucher') {
      setFormData({
        itemType: 'voucher',
        name: voucher.name,
        value: voucher.value || '',
        issuer: voucher.issuer || issuer,
        expiryDate: voucher.expiryDate || '',
        code: voucher.code || '',
        imageUrl: voucher.imageUrl || '',
        notes: voucher.notes || '',
        eventDate: '',
        time: '',
        address: ''
      });
    } else {
      setFormData({
        itemType: 'reservation',
        name: voucher.name,
        eventDate: voucher.eventDate || '',
        time: voucher.time || '',
        address: voucher.address || '',
        code: voucher.code || '',
        imageUrl: voucher.imageUrl || '',
        notes: voucher.notes || '',
        value: '',
        issuer: issuer,
        expiryDate: ''
      });
    }

    // Attempt to scrape
    await scrapeReservationDetails(voucher.code, issuer);

    // Update the voucher with newly scraped data
    // Note: formData will be updated by scrapeReservationDetails
    setTimeout(() => {
      const updatedVouchers = vouchers.map(v =>
        v.id === voucher.id
          ? {
              ...v,
              name: formData.name || v.name,
              ...(v.itemType === 'reservation' && {
                eventDate: formData.eventDate || (v as Reservation).eventDate,
                time: formData.time || (v as Reservation).time,
                address: formData.address || (v as Reservation).address
              })
            }
          : v
      );
      onUpdateVouchers(updatedVouchers);
    }, 1000);
  };

  const openAddModal = () => {
    resetForm();
    setEditingVoucher(null);
    setIsAddModalOpen(true);
  };

  const closeModal = () => {
    setIsAddModalOpen(false);
    setEditingVoucher(null);
    resetForm();
  };

  return (
    <div className="w-full px-6 py-8 overflow-x-hidden" style={{ backgroundColor: '#F5F2E7' }}>
      <header className="mb-8 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <button
              onClick={onBack}
              className="text-2xl hover:opacity-50 transition-opacity flex-shrink-0"
            >
              ←
            </button>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold truncate" style={{ color: '#630606' }}>
                {listName}
              </h1>
              <p className="text-xs mt-1" style={{ color: '#8E806A' }}>
                {t('voucher', { count: vouchers.length })}
              </p>
            </div>
          </div>

          <button
            onClick={openAddModal}
            className="flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90"
            style={{ backgroundColor: '#630606' }}
          >
            {t('addVoucher')}
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto">
        {/* Empty State */}
        {vouchers.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🎫</div>
            <h2 className="text-2xl font-semibold mb-2" style={{ color: '#630606' }}>
              {t('noVouchersYet')}
            </h2>
            <p className="text-sm mb-6" style={{ color: '#8E806A' }}>
              {t('noVouchersAdd')}
            </p>
            <button
              onClick={openAddModal}
              className="px-6 py-3 rounded-lg font-medium text-white transition-all hover:opacity-90"
              style={{ backgroundColor: '#630606' }}
            >
              {t('addVoucher')}
            </button>
          </div>
        )}

        {/* Voucher Grid */}
        {vouchers.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {vouchers.map((voucher) => (
              <VoucherCard
                key={voucher.id}
                voucher={voucher}
                onEdit={handleEditVoucher}
                onDelete={(id) => setDeleteConfirmation(id)}
                onRefreshDetails={handleRefreshDetails}
              />
            ))}
          </div>
        )}
      </main>

      {/* Add/Edit Voucher Modal */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold" style={{ color: '#630606' }}>
                  {editingVoucher ? t('common:edit') : t('addVoucher')}
                </h2>
                <p className="text-xs mt-1" style={{ color: '#8E806A' }}>
                  Type: {formData.itemType} • List: {listName}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="text-2xl hover:opacity-50 transition-opacity"
                style={{ color: '#8E806A' }}
              >
                ×
              </button>
            </div>

            <form onSubmit={editingVoucher ? handleUpdateVoucher : handleAddVoucher} className="space-y-4">
              {/* Smart Paste Field - Always visible for smart input */}
              <div className="p-4 rounded-xl" style={{ backgroundColor: prioritizeSmartPaste ? '#63060608' : 'transparent', border: prioritizeSmartPaste ? 'none' : '1px solid #8E806A22' }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">✨</span>
                  <label className="block text-sm font-medium" style={{ color: '#630606' }}>
                    Smart Link / SMS Paste
                  </label>
                </div>
                <textarea
                  value={smartPaste}
                  onChange={(e) => handleSmartPaste(e.target.value)}
                  placeholder="Paste voucher link or SMS (BuyMe/Ontopo auto-detected)"
                  className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:border-[#630606] transition-colors resize-none"
                  style={{ borderColor: '#8E806A33' }}
                  rows={3}
                />
                <p className="text-xs mt-2" style={{ color: '#8E806A' }}>
                  💡 Paste SMS or URL to auto-fill fields
                </p>
                {isScraping && (
                  <div className="mt-2 flex items-center gap-2 text-sm" style={{ color: '#630606' }}>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Fetching details from URL...
                  </div>
                )}
              </div>

              {/* Image Upload - Prioritized for Physical Cards */}
              {isPhysical && (
                <div className="p-4 rounded-xl" style={{ backgroundColor: '#63060608' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">📸</span>
                    <label className="block text-sm font-medium" style={{ color: '#630606' }}>
                      Upload Card Photo
                    </label>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:border-[#630606] transition-colors"
                    style={{ borderColor: '#8E806A33' }}
                  />
                  {isScanning && (
                    <div className="mt-2 flex items-center gap-2 text-sm" style={{ color: '#630606' }}>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Scanning image...
                    </div>
                  )}
                  {isUploading && (
                    <div className="mt-2 flex items-center gap-2 text-sm" style={{ color: '#8E806A' }}>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving to cloud...
                    </div>
                  )}
                  <p className="text-xs mt-2" style={{ color: '#8E806A' }}>
                    💡 We'll automatically detect codes and values from your photo
                  </p>
                </div>
              )}

              {/* Standard Image Upload (for non-physical) */}
              {!isPhysical && (
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#630606' }}>
                    Card Photo
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:border-[#630606] transition-colors"
                    style={{ borderColor: '#8E806A33' }}
                  />
                  {isScanning && (
                    <div className="mt-2 flex items-center gap-2 text-sm" style={{ color: '#630606' }}>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Scanning image...
                    </div>
                  )}
                  {isUploading && (
                    <div className="mt-2 flex items-center gap-2 text-sm" style={{ color: '#8E806A' }}>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving to cloud...
                    </div>
                  )}
                </div>
              )}

              {/* Image Preview */}
              {formData.imageUrl && (
                <div className="relative">
                  <img
                    src={formData.imageUrl}
                    alt="Preview"
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, imageUrl: '' }));
                      setImageSize('');
                    }}
                    className="absolute top-2 end-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  {imageSize && (
                    <div className="absolute bottom-2 start-2 px-2 py-1 bg-black/70 text-white text-xs rounded">
                      {imageSize}
                    </div>
                  )}
                </div>
              )}

              {/* Name (Required) */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#630606' }}>
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Azrieli Gift Card"
                  className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:border-[#630606] transition-colors"
                  style={{ borderColor: '#8E806A33' }}
                  required
                />
              </div>

              {/* Voucher-specific Fields */}
              {formData.itemType === 'voucher' && (
                <>
                  {/* Value */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#630606' }}>
                      Value
                    </label>
                    <input
                      type="text"
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                      placeholder="e.g., ₪200 or 2 Movie Tickets"
                      className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:border-[#630606] transition-colors"
                      style={{ borderColor: '#8E806A33' }}
                    />
                  </div>

                  {/* Issuer */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#630606' }}>
                      Issuer
                    </label>
                    <input
                      type="text"
                      value={formData.issuer}
                      onChange={(e) => setFormData({ ...formData, issuer: e.target.value })}
                      placeholder="e.g., BuyMe, Azrieli"
                      className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:border-[#630606] transition-colors"
                      style={{ borderColor: '#8E806A33' }}
                    />
                  </div>

                  {/* Expiry Date */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#630606' }}>
                      Expiry Date
                    </label>
                    <input
                      type="date"
                      value={formData.expiryDate}
                      onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:border-[#630606] transition-colors"
                      style={{ borderColor: '#8E806A33' }}
                    />
                  </div>
                </>
              )}

              {/* Reservation-specific Fields */}
              {formData.itemType === 'reservation' && (
                <>
                  {/* Event Date */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#630606' }}>
                      Event Date
                    </label>
                    <input
                      type="date"
                      value={formData.eventDate}
                      onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:border-[#630606] transition-colors"
                      style={{ borderColor: '#8E806A33' }}
                    />
                  </div>

                  {/* Time */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#630606' }}>
                      Time
                    </label>
                    <input
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:border-[#630606] transition-colors"
                      style={{ borderColor: '#8E806A33' }}
                    />
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#630606' }}>
                      Address
                    </label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="e.g., 123 Main St, Tel Aviv"
                      className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:border-[#630606] transition-colors"
                      style={{ borderColor: '#8E806A33' }}
                    />
                  </div>
                </>
              )}

              {/* Code */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#630606' }}>
                  Code / Barcode / URL
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g., ABC123456 or https://buyme.co.il/..."
                  className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:border-[#630606] transition-colors"
                  style={{ borderColor: '#8E806A33' }}
                />
                {formData.code && formData.code.includes(' / ') && (
                  <p className="text-xs mt-1 flex items-center gap-1" style={{ color: '#10B981' }}>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Multiple codes detected and saved
                  </p>
                )}
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-3 rounded-lg font-medium transition-colors hover:bg-[#8E806A11]"
                  style={{ color: '#8E806A', border: '1px solid #8E806A33' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isScanning}
                  className="flex-1 px-4 py-3 rounded-lg font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: '#630606' }}
                >
                  {isScanning ? 'Processing...' : editingVoucher ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Fill Prompt Modal */}
      {showManualFillPrompt && isAddModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4"
          onClick={() => setShowManualFillPrompt(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-4">
              {extractionResults.length > 0 ? (
                <>
                  <div className="text-5xl mb-3">✅</div>
                  <h2 className="text-2xl font-bold mb-2" style={{ color: '#630606' }}>
                    Almost Done!
                  </h2>
                  <p className="text-sm mb-4" style={{ color: '#8E806A' }}>
                    We auto-filled: <strong>{extractionResults.join(', ')}</strong>
                  </p>
                  <div className="p-3 rounded-lg mb-4" style={{ backgroundColor: '#F59E0B11', border: '1px solid #F59E0B33' }}>
                    <p className="text-sm" style={{ color: '#D97706' }}>
                      Please complete the remaining fields below.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-5xl mb-3">📝</div>
                  <h2 className="text-2xl font-bold mb-2" style={{ color: '#630606' }}>
                    Complete the Details
                  </h2>
                  <p className="text-sm mb-4" style={{ color: '#8E806A' }}>
                    Please fill in the fields below.
                  </p>
                </>
              )}

              {formData.itemType === 'reservation' && (
                <div className="text-start mb-4 p-3 rounded-lg" style={{ backgroundColor: '#F5F2E7' }}>
                  <p className="text-xs font-medium mb-2" style={{ color: '#630606' }}>
                    Fields to check:
                  </p>
                  <ul className="text-xs space-y-1" style={{ color: '#8E806A' }}>
                    {!formData.name && <li>• Restaurant/Venue Name</li>}
                    {!formData.eventDate && <li>• Event Date</li>}
                    {!formData.time && <li>• Time</li>}
                    {!formData.address && <li>• Address</li>}
                  </ul>
                </div>
              )}

              {formData.itemType === 'voucher' && (
                <div className="text-start mb-4 p-3 rounded-lg" style={{ backgroundColor: '#F5F2E7' }}>
                  <p className="text-xs font-medium mb-2" style={{ color: '#630606' }}>
                    Fields to check:
                  </p>
                  <ul className="text-xs space-y-1" style={{ color: '#8E806A' }}>
                    {!formData.name && <li>• Voucher Name</li>}
                    {!formData.value && <li>• Value</li>}
                    {!formData.expiryDate && <li>• Expiry Date</li>}
                  </ul>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowManualFillPrompt(false)}
              className="w-full px-4 py-3 rounded-lg font-medium text-white transition-all hover:opacity-90"
              style={{ backgroundColor: '#630606' }}
            >
              Got it, I'll fill the rest
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteConfirmation !== null}
        onClose={() => setDeleteConfirmation(null)}
        onConfirm={() => deleteConfirmation && handleDeleteVoucher(deleteConfirmation)}
        title={t('deleteVoucher')}
        message={t('deleteVoucherMessage')}
        confirmText={t('deleteConfirm')}
        isDestructive
      />
    </div>
  );
}

export default VoucherList;

import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabaseClient';

export interface VoucherFormData {
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
}

const emptyForm = (): VoucherFormData => ({
  name: '',
  value: '',
  issuer: '',
  expiryDate: '',
  code: '',
  imageUrl: '',
  notes: '',
  eventDate: '',
  time: '',
  address: '',
});

export function useVoucherForm(listType: 'voucher' | 'reservation') {
  const { profile } = useAuth();
  const [formData, setFormData] = useState<VoucherFormData>(emptyForm());
  const [smartPaste, setSmartPaste] = useState('');
  const [imageSize, setImageSize] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showManualFillPrompt, setShowManualFillPrompt] = useState(false);
  const [extractionResults, setExtractionResults] = useState<string[]>([]);

  const resetForm = () => {
    setFormData(emptyForm());
    setSmartPaste('');
    setImageSize('');
    setShowManualFillPrompt(false);
    setExtractionResults([]);
  };

  const populateForEdit = (data: VoucherFormData) => {
    setFormData(data);
    setSmartPaste('');
    setImageSize('');
  };

  // ── Web scraping ────────────────────────────────────────────────────────────
  const scrapeReservationDetails = async (url: string, issuer: string) => {
    setIsScraping(true);

    try {
      if (issuer === 'Ontopo' && url.includes('/ticket/')) {
        const ticketId = url.split('/ticket/')[1]?.split('?')[0];
        if (ticketId) {
          const apiEndpoints = [
            `https://ontopo.com/api/ticket/${ticketId}`,
            `https://ontopo.com/api/v1/ticket/${ticketId}`,
            `https://ontopo.com/api/reservations/${ticketId}`,
            `https://api.ontopo.com/ticket/${ticketId}`,
          ];

          for (const apiUrl of apiEndpoints) {
            try {
              const response = await fetch(apiUrl);
              if (response.ok) {
                const data = await response.json();
                if (data) {
                  const apiName = data.restaurant?.name || data.venue?.name || data.restaurantName || '';
                  const apiDate = data.date || data.reservationDate || data.eventDate || '';
                  const apiTime = data.time || data.reservationTime || '';
                  const apiAddress = data.restaurant?.address || data.venue?.address || data.address || '';
                  if (apiName || apiDate || apiTime || apiAddress) {
                    setFormData(prev => ({
                      ...prev,
                      ...(apiName && { name: apiName }),
                      ...(apiDate && listType === 'reservation' && { eventDate: apiDate }),
                      ...(apiTime && listType === 'reservation' && { time: apiTime }),
                      ...(apiAddress && listType === 'reservation' && { address: apiAddress }),
                    }));
                    setIsScraping(false);
                    return;
                  }
                }
              }
            } catch {
              // try next endpoint
            }
          }
        }
      }

      // Fallback: HTML scraping
      let html = '';
      try {
        const response = await fetch(url);
        html = await response.text();
      } catch {
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
        const response = await fetch(proxyUrl);
        const data = await response.json();
        html = data.contents;
      }

      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      let extractedName = '';
      let extractedDate = '';
      let extractedTime = '';
      let extractedAddress = '';

      if (issuer === 'Ontopo') {
        const metaTags = {
          title: doc.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
                 doc.querySelector('meta[name="twitter:title"]')?.getAttribute('content') ||
                 doc.querySelector('title')?.textContent,
          description: doc.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
                       doc.querySelector('meta[name="description"]')?.getAttribute('content'),
        };

        if (metaTags.title) {
          extractedName = metaTags.title
            .replace(/\s*[-|]\s*(Ontopo|אונטופו).*/i, '')
            .replace(/הזמנה ב/, '')
            .replace(/Reservation at/i, '')
            .trim();
        }

        if (metaTags.description) {
          const dateMatch = metaTags.description.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/);
          if (dateMatch) {
            const day = dateMatch[1].padStart(2, '0');
            const month = dateMatch[2].padStart(2, '0');
            const year = dateMatch[3].length === 2 ? `20${dateMatch[3]}` : dateMatch[3];
            extractedDate = `${year}-${month}-${day}`;
          }
          const timeMatch = metaTags.description.match(/(\d{1,2}):(\d{2})/);
          if (timeMatch) extractedTime = `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`;
        }

        if (!extractedName) {
          for (const selector of ['h1', 'h2', '.restaurant-name', '[class*="restaurant"]', '[class*="venue"]', '[class*="title"]']) {
            const el = doc.querySelector(selector);
            if (el) {
              const text = el.textContent?.trim() || '';
              if (text.length > 2) { extractedName = text; break; }
            }
          }
        }

        for (const selector of ['[class*="date"]', '[class*="time"]', '[datetime]', 'time']) {
          const elements = doc.querySelectorAll(selector);
          elements.forEach(element => {
            const datetime = element.getAttribute('datetime');
            if (datetime) {
              const date = new Date(datetime);
              if (!isNaN(date.getTime())) {
                extractedDate = date.toISOString().split('T')[0];
                extractedTime = date.toTimeString().slice(0, 5);
              }
            } else {
              const text = element.textContent?.trim() || '';
              const dateMatch = text.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/);
              const timeMatch = text.match(/(\d{1,2}):(\d{2})/);
              if (dateMatch && !extractedDate) {
                const day = dateMatch[1].padStart(2, '0');
                const month = dateMatch[2].padStart(2, '0');
                const year = dateMatch[3].length === 2 ? `20${dateMatch[3]}` : dateMatch[3];
                extractedDate = `${year}-${month}-${day}`;
              }
              if (timeMatch && !extractedTime) extractedTime = `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`;
            }
          });
        }

        for (const selector of ['[class*="address"]', '[class*="location"]', 'address', '[itemprop="address"]', 'meta[property="og:street-address"]']) {
          const el = doc.querySelector(selector);
          if (el) {
            const text = el.textContent?.trim() || (el as HTMLMetaElement).content?.trim() || '';
            if (text) { extractedAddress = text; break; }
          }
        }

        doc.querySelectorAll('script[type="application/ld+json"]').forEach(script => {
          try {
            const data = JSON.parse(script.textContent || '');
            if (data['@type'] === 'FoodEstablishment' || data['@type'] === 'Restaurant') {
              extractedName = extractedName || data.name || '';
              extractedAddress = extractedAddress || data.address?.streetAddress || '';
            }
            if (data['@type'] === 'Event' || data['@type'] === 'Reservation') {
              extractedDate = extractedDate || data.startDate?.split('T')[0] || '';
              extractedTime = extractedTime || data.startDate?.split('T')[1]?.slice(0, 5) || '';
            }
          } catch { /* skip */ }
        });
      }

      setFormData(prev => ({
        ...prev,
        ...(extractedName && { name: extractedName }),
        ...(extractedDate && listType === 'reservation' && { eventDate: extractedDate }),
        ...(extractedTime && listType === 'reservation' && { time: extractedTime }),
        ...(extractedAddress && listType === 'reservation' && { address: extractedAddress }),
      }));

      const extractedFields = [
        extractedName && 'Name',
        extractedDate && 'Date',
        extractedTime && 'Time',
        extractedAddress && 'Address',
      ].filter(Boolean) as string[];

      setExtractionResults(extractedFields);
      setShowManualFillPrompt(true);
    } catch (error) {
      console.error('Scraping error:', error);
      setExtractionResults([]);
      setShowManualFillPrompt(true);
    } finally {
      setIsScraping(false);
    }
  };

  // ── Smart paste / SMS parsing ───────────────────────────────────────────────
  const handleSmartPaste = (text: string) => {
    setSmartPaste(text);

    const urlPatterns: Record<string, RegExp> = {
      buyme: /buyme\.(?:co\.il|com)[^\s]*/i,
      ontopo: /ontopo\.(?:co\.il|com)[^\s]*/i,
      restoya: /restoya\.(?:co\.il|com)[^\s]*/i,
      tenbis: /10bis\.(?:co\.il|com)[^\s]*/i,
      goody: /goody\.(?:co\.il|com)[^\s]*/i,
      wolt: /wolt\.com[^\s]*/i,
      bolt: /bolt\.eu[^\s]*/i,
      uber: /uber\.com[^\s]*/i,
      generic: /(https?:\/\/[^\s]+)/i,
    };

    let matchedService = '';
    let matchedUrl = '';

    for (const [service, pattern] of Object.entries(urlPatterns)) {
      if (service === 'generic') continue;
      const match = text.match(pattern);
      if (match) { matchedService = service; matchedUrl = match[0]; break; }
    }

    if (!matchedUrl) {
      const genericMatch = text.match(urlPatterns.generic);
      if (genericMatch) { matchedUrl = genericMatch[0]; matchedService = 'generic'; }
    }

    if (!matchedUrl) return;

    const fullUrl = matchedUrl.startsWith('http') ? matchedUrl : `https://${matchedUrl}`;

    const issuerMap: Record<string, string> = {
      buyme: 'BuyMe', ontopo: 'Ontopo', restoya: 'Restoya',
      tenbis: '10Bis', goody: 'Goody', wolt: 'Wolt', bolt: 'Bolt', uber: 'Uber', generic: 'Gift Card',
    };
    const issuer = issuerMap[matchedService] || '';

    let voucherName = '';
    let eventDate = '';
    let eventTime = '';
    let address = '';

    if (matchedService === 'ontopo' || matchedService === 'restoya') {
      const namePatterns = [
        /הזמנתכם\s+ל\s*([^\s]+)\s+בקישור/,
        /ל\s*([A-Z0-9\u0590-\u05FF]+)\s+בקישור/i,
        /reservation\s+at\s+([^:\s]+)/i,
        /to\s+([A-Z][a-zA-Z\s]+?)\s+(?:for|on|at)/i,
        /ל\s*([A-Za-z0-9\u0590-\u05FF]+)/,
      ];
      for (const pattern of namePatterns) {
        const match = text.match(pattern);
        if (match?.[1]) { voucherName = match[1].trim(); break; }
      }
      if (!voucherName) voucherName = 'Ontopo Reservation';

      const datePatterns = [
        /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/,
        /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/,
      ];
      for (const pattern of datePatterns) {
        const match = text.match(pattern);
        if (match) {
          if (match[0].includes('-') && match[1].length === 4) {
            eventDate = match[0];
          } else if (match[1] && match[2] && match[3]) {
            eventDate = `${match[3].length === 2 ? '20' + match[3] : match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
          }
          break;
        }
      }

      const timePatterns = [/(\d{1,2}):(\d{2})/, /בשעה\s*(\d{1,2})[:\.](\d{2})?/, /at\s*(\d{1,2})[:\.](\d{2})\s*(AM|PM)?/i];
      for (const pattern of timePatterns) {
        const match = text.match(pattern);
        if (match) {
          let hours = parseInt(match[1]);
          const minutes = match[2] ? match[2].padStart(2, '0') : '00';
          if (match[3]?.toUpperCase() === 'PM' && hours < 12) hours += 12;
          if (match[3]?.toUpperCase() === 'AM' && hours === 12) hours = 0;
          eventTime = `${hours.toString().padStart(2, '0')}:${minutes}`;
          break;
        }
      }

      const addressPatterns = [
        /(?:כתובת|address)[:\s]+([^\n\r]+)/i,
        /(?:רחוב|st\.|street)\s+([^\n\r,]+(?:,\s*[^\n\r]+)?)/i,
      ];
      for (const pattern of addressPatterns) {
        const match = text.match(pattern);
        if (match?.[1]) { address = match[1].trim(); break; }
      }
    } else if (['buyme', 'goody', 'tenbis', 'generic'].includes(matchedService)) {
      const namePatterns = [
        /gift\s+card\s+(?:from|for)\s+([^.\s]+)/i,
        /([A-Z][a-zA-Z\s]+?)\s+gift\s+card/i,
        /voucher\s+(?:from|for)\s+([^.\s]+)/i,
        /שובר\s+(?:של|ל|מ)?\s*([^\s]+)/i,
        /כרטיס\s+(?:מתנה|של|ל)?\s*([^\s]+)/i,
      ];
      for (const pattern of namePatterns) {
        const match = text.match(pattern);
        if (match?.[1]) { voucherName = match[1].trim(); break; }
      }
      if (!voucherName) voucherName = `${issuer} Gift Card`;
    } else if (['wolt', 'bolt', 'uber'].includes(matchedService)) {
      const namePatterns = [
        /(?:to|pickup from|destination)[:\s]+([^\n\r]+)/i,
        /(?:order|delivery) (?:from|at)[:\s]+([^\n\r]+)/i,
      ];
      for (const pattern of namePatterns) {
        const match = text.match(pattern);
        if (match?.[1]) { voucherName = match[1].trim(); break; }
      }
      if (!voucherName) voucherName = `${issuer} Booking`;

      const dateMatch = text.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/);
      const timeMatch = text.match(/(\d{1,2}):(\d{2})/);
      if (dateMatch) {
        const [, d, m, y] = dateMatch;
        eventDate = `${y.length === 2 ? '20' + y : y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      }
      if (timeMatch) eventTime = `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`;
    }

    const updatedData = listType === 'reservation'
      ? { name: voucherName, code: fullUrl, issuer, eventDate: eventDate || '', time: eventTime || '', address: address || '', value: '', expiryDate: '' }
      : { name: voucherName, code: fullUrl, issuer, value: '', expiryDate: '', eventDate: '', time: '', address: '' };

    setFormData(prev => ({ ...prev, ...updatedData }));

    if (fullUrl) setTimeout(() => scrapeReservationDetails(fullUrl, issuer || 'Unknown'), 500);
  };

  // ── Image compression ───────────────────────────────────────────────────────
  const compressImage = (base64: string, quality: number): Promise<string> =>
    new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxWidth = 1200;
        const scaleSize = maxWidth / img.width;
        canvas.width = img.width > maxWidth ? maxWidth : img.width;
        canvas.height = img.width > maxWidth ? img.height * scaleSize : img.height;
        canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = base64;
    });

  // ── Image upload + OCR ──────────────────────────────────────────────────────
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, listId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const originalSizeKB = (file.size / 1024).toFixed(1);
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      const ok = window.confirm(`Image size is ${(file.size / 1024 / 1024).toFixed(1)}MB. Large images may impact performance. Continue?`);
      if (!ok) { setImageSize(''); return; }
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      let base64 = reader.result as string;
      let wasCompressed = false;
      if (file.size > 500 * 1024) { base64 = await compressImage(base64, 0.7); wasCompressed = true; }

      const compressedSizeKB = ((base64.length * 3) / 4 / 1024).toFixed(1);
      setImageSize(wasCompressed ? `${originalSizeKB}KB → ${compressedSizeKB}KB (compressed)` : `${originalSizeKB}KB`);
      setFormData(prev => ({ ...prev, imageUrl: base64 }));

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
              .createSignedUrl(storagePath, 315_360_000);
            if (signedError || !signedData?.signedUrl) throw signedError ?? new Error('No signed URL');
            setFormData(prev => ({ ...prev, imageUrl: signedData.signedUrl }));
          })
          .catch(err => console.error('Storage upload failed, keeping base64 fallback:', err))
          .finally(() => setIsUploading(false));
      }

      setIsScanning(true);
      try {
        const { default: Tesseract } = await import('tesseract.js');
        const { data: { text } } = await Tesseract.recognize(base64, 'heb+eng', { logger: () => {} });

        const digitMatches = text.match(/\d{6,}/g);
        if (digitMatches && digitMatches.length > 0) {
          setFormData(prev => ({ ...prev, code: digitMatches.length > 1 ? digitMatches.join(' / ') : digitMatches[0] }));
        }

        const cleanedText = text.replace(/[‏‎\u200E\u200F]/g, '').replace(/\n\s*/g, ' ');
        const urlPattern = /https?:\/\/\s*[\w.\-/]+(?:\s+[\w.\-/]+)*/gi;
        const urlMatches = cleanedText.match(urlPattern);
        if (urlMatches && urlMatches.length > 0) {
          const extractedUrl = urlMatches[0].replace(/\s+/g, '').trim();
          setFormData(prev => ({ ...prev, code: extractedUrl }));
          const cleanedForParsing = cleanedText.replace(urlPattern, (m) => m.replace(/\s+/g, ''));
          setTimeout(() => handleSmartPaste(cleanedForParsing), 100);
        }

        const namePatterns = [/הזמנתכם\s+ל\s*([^\s\n]+)/, /ל\s*([A-Z0-9\u0590-\u05FF]+)\s+בקישור/i, /reservation\s+(?:at|for)\s+([^\n\r]+)/i];
        for (const pattern of namePatterns) {
          const match = text.match(pattern);
          if (match?.[1]) { setFormData(prev => ({ ...prev, name: match[1].trim() })); break; }
        }

        const currencyPattern = /[₪$€£¥]\s*\d+(?:[.,]\d+)?|\d+(?:[.,]\d+)?\s*[₪$€£¥]/g;
        const currencyMatches = text.match(currencyPattern);
        if (currencyMatches) setFormData(prev => ({ ...prev, value: currencyMatches[0].trim() }));

        const datePatterns = [
          /(?:exp(?:iry)?|valid until|expires?|date|event)[:\s]*(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/i,
          /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/,
          /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/,
        ];
        for (const pattern of datePatterns) {
          const match = text.match(pattern);
          if (match) {
            let extractedDate = '';
            if (match[0].includes('-') && match[1].length === 4) {
              extractedDate = match[0].match(/\d{4}-\d{1,2}-\d{1,2}/)?.[0] || '';
            } else if (match[1] && match[2] && match[3]) {
              const y = match[3].length === 2 ? `20${match[3]}` : match[3];
              extractedDate = `${y}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
            }
            if (extractedDate) {
              setFormData(prev => ({ ...prev, ...(listType === 'voucher' ? { expiryDate: extractedDate } : { eventDate: extractedDate }) }));
              break;
            }
          }
        }

        const timePatterns = [/(\d{1,2}):(\d{2})\s*(AM|PM)?/i, /(?:time)[:\s]*(\d{1,2}):(\d{2})/i];
        for (const pattern of timePatterns) {
          const match = text.match(pattern);
          if (match && listType === 'reservation') {
            let hours = parseInt(match[1]);
            if (match[3]?.toUpperCase() === 'PM' && hours < 12) hours += 12;
            if (match[3]?.toUpperCase() === 'AM' && hours === 12) hours = 0;
            setFormData(prev => ({ ...prev, time: `${hours.toString().padStart(2, '0')}:${match[2]}` }));
            break;
          }
        }

        if (listType === 'reservation') {
          const addressKeywords = ['רחוב', 'כתובת', 'מיקום', 'ברחוב', 'street', 'address', 'location', 'at'];
          const lowerText = text.toLowerCase();
          for (const keyword of addressKeywords) {
            const idx = lowerText.indexOf(keyword.toLowerCase());
            if (idx !== -1) {
              const afterKeyword = text.substring(idx + keyword.length).trim();
              const addressMatch = afterKeyword.match(/^[^\n]{1,50}/);
              if (addressMatch) { setFormData(prev => ({ ...prev, address: addressMatch[0].trim() })); break; }
            }
          }
        }

        const extractedFields: string[] = [];
        if (urlMatches?.length) extractedFields.push('URL');
        if (digitMatches?.length) extractedFields.push('Code(s)');
        if (currencyMatches?.length) extractedFields.push('Value');
        if (extractedFields.length > 0) {
          setTimeout(() => alert(`📸 OCR Extraction Complete!\n\nExtracted: ${extractedFields.join(', ')}\n\n⚠️ Important: OCR may misread similar characters.\n\n✅ Please verify the URL/codes are correct.\n\n💡 Tip: For 100% accuracy, paste SMS text directly instead of using screenshots.`), 500);
        }
      } catch (error) {
        console.error('OCR Error:', error);
      } finally {
        setIsScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return {
    formData,
    setFormData,
    smartPaste,
    imageSize,
    setImageSize,
    isScraping,
    isScanning,
    isUploading,
    showManualFillPrompt,
    setShowManualFillPrompt,
    extractionResults,
    resetForm,
    populateForEdit,
    handleSmartPaste,
    handleImageUpload,
  };
}

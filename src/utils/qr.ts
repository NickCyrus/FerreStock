import QRCode from 'qrcode';

export const generateQrDataUrl = async (text: string, size = 200): Promise<string> => {
  try {
    return await QRCode.toDataURL(text, {
      width: size,
      margin: 1,
      color: {
        dark: '#18181b',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    return '';
  }
};

export const parseQrPayload = (payload: string): { sku?: string; barcode?: string; name?: string; raw: string } => {
  const parts = payload.split('|');
  if (parts.length >= 3) {
    return {
      sku: parts[0].trim(),
      barcode: parts[1].trim(),
      name: parts[2].trim(),
      raw: payload,
    };
  }
  return {
    sku: payload.startsWith('FER-') ? payload.trim() : undefined,
    barcode: /^\d{10,14}$/.test(payload.trim()) ? payload.trim() : undefined,
    raw: payload,
  };
};

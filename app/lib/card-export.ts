/**
 * Card Export Utilities for Seivio
 *
 * Note: PNG/PDF export requires native libraries that have compatibility
 * issues with React Native 0.76. Current implementation provides:
 * - Share functionality (working)
 * - Link copy (working)
 * - Print guide (working)
 *
 * For full PNG/PDF export, one of these approaches is needed:
 * 1. Use react-native-view-shot with --legacy-peer-deps (not recommended)
 * 2. Wait for React Native 0.76 compatible view capture library
 * 3. Implement server-side rendering via Supabase Edge Function
 * 4. Use Expo's upcoming capture API when available
 */

import { Share } from 'react-native';

export interface ExportOptions {
  format: 'png' | 'pdf' | 'share';
  quality?: number;
}

/**
 * Share the provider profile via system share sheet
 * This is currently fully functional.
 */
export async function shareProviderCard(
  providerName: string,
  publicUrl: string
): Promise<void> {
  try {
    await Share.share({
      title: `${providerName} on Seivio`,
      message: `Connect with ${providerName} on Seivio: ${publicUrl}`,
      url: publicUrl,
    });
  } catch (error) {
    console.error('Share error:', error);
    throw error;
  }
}

/**
 * Future: Export card as PNG image
 * Blocked by: No React Native 0.76 compatible view capture library
 *
 * Implementation when available:
 * import { captureRef } from 'react-native-view-shot';
 * const uri = await captureRef(cardRef, { format: 'png', quality: 1 });
 * await MediaLibrary.saveToLibraryAsync(uri);
 */
export async function exportCardAsPNG(): Promise<void> {
  throw new Error(
    'PNG export requires React Native 0.76 compatible view capture library. ' +
    'Currently blocked by dependency conflicts. Use Share or Copy Link instead.'
  );
}

/**
 * Future: Export card as PDF
 * Blocked by: No React Native 0.76 compatible PDF generation library
 *
 * Implementation when available:
 * import RNHTMLtoPDF from 'react-native-html-to-pdf';
 * const options = { html: cardHTML, fileName: 'card', base64: true };
 * const file = await RNHTMLtoPDF.convert(options);
 */
export async function exportCardAsPDF(): Promise<void> {
  throw new Error(
    'PDF export requires React Native 0.76 compatible PDF library. ' +
    'Currently blocked by dependency conflicts. Use Share or Copy Link instead.'
  );
}

/**
 * Check if export functionality is available
 */
export function isExportAvailable(): boolean {
  return false; // PNG/PDF export not available due to dependency conflicts
}

/**
 * Get available export methods
 */
export function getAvailableMethods(): string[] {
  return ['share', 'copy-link']; // PNG and PDF not available
}

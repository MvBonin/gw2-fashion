/**
 * Abbreviates a fashion code to a specified length
 * @param code - The full fashion code string
 * @param maxLength - Maximum length (default: 50)
 * @returns Abbreviated code with "..." if truncated
 */
export function abbreviateFashionCode(
  code: string,
  maxLength: number = 50
): string {
  if (!code || code.length <= maxLength) {
    return code;
  }
  return code.substring(0, maxLength) + "...";
}

/**
 * Copies text to clipboard
 * @param text - Text to copy
 * @returns Promise that resolves when text is copied
 */
export async function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(text);
  } else {
    // Fallback for older browsers
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);
  }
}


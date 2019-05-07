/**
 * Get the HEXA color for the passed HEX color and opacity
 */
export default function(color: string, opacity: number = 1): string {
  const alpha = Math.round(opacity * 255);
  const hex = (alpha + 0x10000).toString(16).substr(-2);

  return color + hex;
}

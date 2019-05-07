/**
 * Get the color for the passed Fusiontables Style icon name
 */
export default function(iconName: string): string {
  if (iconName.endsWith('yellow')) {
    return '#ff9';
  }

  if (iconName.endsWith('green')) {
    return '#9f9';
  }

  if (iconName.endsWith('blue')) {
    return '#99f';
  }

  if (iconName.endsWith('purple')) {
    return '#f9f';
  }

  if (iconName.endsWith('red')) {
    return '#f66';
  }

  return '#f66';
}

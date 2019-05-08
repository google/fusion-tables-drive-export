/**
 * Get the color for the passed Fusiontables Style icon name
 */
export default function(iconName: string): string {
  if (iconName.endsWith('yellow')) {
    return '#ffff99ff';
  }

  if (iconName.endsWith('green')) {
    return '#99ff99ff';
  }

  if (iconName.endsWith('blue')) {
    return '#9999ffff';
  }

  if (iconName.endsWith('purple')) {
    return '#ff99ffff';
  }

  if (iconName.endsWith('red')) {
    return '#ff6666ff';
  }

  return '#ff6666ff';
}

import {IStyle} from '../interfaces/style';

const btoa = (data: string) => Buffer.from(data).toString('base64');

/**
 * Get the hash for a style
 */
export default function(style: IStyle): string {
  return btoa(JSON.stringify(style));
}

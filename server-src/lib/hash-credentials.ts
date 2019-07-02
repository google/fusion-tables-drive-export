import crypto from 'crypto';
import {Credentials} from 'google-auth-library';

/**
 * Create a hash from the credentials
 */
export default function(credentials: Credentials): string {
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(credentials))
    .digest('hex');
}

import {Request, Response} from 'express';

/**
 * Handle an error
 */
export default function(error: any, req: Request, res: Response) {
  console.log(error);
  if (error.response && error.response.status === 400) {
    req.session = undefined;
    res.redirect(303, '/');
    return;
  }
  res.render('error', {error});
}

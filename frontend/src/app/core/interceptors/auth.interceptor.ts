import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  const addToken = (r: HttpRequest<any>, token: string) =>
    r.clone({ setHeaders: { Authorization: `Bearer ${token}` } });

  const token = auth.getToken();
  const request = token ? addToken(req, token) : req;

  return next(request).pipe(
    catchError(err => {
      // Only attempt refresh for 401 errors, when we have a refresh token,
      // and not on auth endpoints themselves (to avoid infinite loops)
      if (err.status === 401 && auth.getRefreshToken() && !req.url.includes('/auth/')) {
        return auth.refresh().pipe(
          switchMap(() => {
            const newToken = auth.getToken();
            return next(newToken ? addToken(req, newToken) : req);
          }),
          catchError(refreshErr => {
            auth.logout();
            return throwError(() => refreshErr);
          })
        );
      }
      return throwError(() => err);
    })
  );
};

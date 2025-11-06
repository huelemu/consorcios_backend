import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    catchError((error) => {
      if (error.status === 401) {
        // Token inválido o expirado
        localStorage.removeItem('token');
        router.navigate(['/login']);
      }

      // Mostrar error en consola (puedes reemplazar con toast/snackbar)
      console.error('Error HTTP:', error);

      return throwError(() => error);
    })
  );
};
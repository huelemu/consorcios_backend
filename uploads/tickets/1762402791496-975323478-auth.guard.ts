import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const AuthGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true;
  }

  // Guardar la URL que intentaba acceder para redirigir después del login
  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
};
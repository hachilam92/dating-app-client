import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { NavigationExtras, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { catchError, map } from 'rxjs/operators';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {

  constructor(
    private router: Router,
    private toastr: ToastrService,
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      map((res: any) => {
        if (res.body?.statusCode) {
          this.toastr.error(res.body.statusCode, res.body.message);
          return throwError(new Error(res.body.message));
        }

        return res;
      }),
      catchError(error => {
        if(error) {
          switch (error.status) {
            case 400:
              var { errors } = error.error;
              if (errors) {
                const modelStateErrors = [];
                for (const key in errors) {
                  if (errors[key]) {
                    modelStateErrors.push(errors[key]);
                  }
                }
                throw modelStateErrors.flat();
              } else {
                this.toastr.error(error.statusText, error.status);
              }
              break;

            case 401:
              this.toastr.error(error.statusText, error.status);
              break;

            case 404:
              this.router.navigateByUrl('/not-found');
              break;

            case 500:
              const navigationExtras: NavigationExtras = {
                state: { error: error.error }
              }
              this.router.navigateByUrl('/server-error', navigationExtras);
              break;

            default:
              this.toastr.error('Something unexpected went wrong');
              console.log(error);
              break;
          }
        }

        return throwError(error);
      })
    );
  }
}

import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GLOBAL_CONSTANTS } from '../../core/constants/globalConstants';

@Component({
  selector: 'app-error-page',
  imports: [RouterLink],
  templateUrl: './error-page.html',
  styleUrl: './error-page.css',
})
export class ErrorPage {
  readonly c = GLOBAL_CONSTANTS.ERROR_PAGE;

  refresh(): void {
    window.location.reload();
  }
}

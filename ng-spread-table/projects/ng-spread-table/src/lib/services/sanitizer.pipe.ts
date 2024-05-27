import { Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({ name: 'bypassHtmlSanitizer', standalone: true })
export class BypassHtmlSanitizerPipe implements PipeTransform {
    sanitizer = inject(DomSanitizer);

    transform(html: string): SafeHtml {
        return this.sanitizer.bypassSecurityTrustHtml(html);
    }
}
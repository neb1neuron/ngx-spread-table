import { Component } from '@angular/core';
import { IRendererComponent, IRendererParams } from '../../models/renderer.models';

@Component({
  selector: 'app-default-renderer',
  templateUrl: './default-renderer.component.html',
  styleUrls: ['./default-renderer.component.scss'],
  standalone: true
})
export class DefaultRendererComponent implements IRendererComponent {

  constructor() { }

  params: IRendererParams | undefined;

  stInit(params: IRendererParams) {
    this.params = params;
  }
}

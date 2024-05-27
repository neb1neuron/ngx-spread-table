import { Component, Input, OnChanges, SimpleChanges, ViewChild, ViewContainerRef } from '@angular/core';
import { IRenderer, IRendererComponent, IRendererParams } from '../../models/renderer.models';
import { DefaultRendererComponent } from '../default-renderer/default-renderer.component';


@Component({
  selector: 'app-renderer',
  templateUrl: './renderer.component.html',
  styleUrls: ['./renderer.component.scss'],
  standalone: true
})
export class RendererComponent implements IRenderer, OnChanges {

  @Input() rendererParams: IRendererParams | undefined;

  defaultRenderer = DefaultRendererComponent;

  constructor() { }

  @ViewChild('renderer', { static: true, read: ViewContainerRef }) rendererContainer!: ViewContainerRef;
  // @ViewChild(RendererDirective, { static: true }) rendererContainer!: RendererDirective;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes && this.rendererParams) {
      this.render();
    }
  }

  private render() {
    const viewContainerRef = this.rendererContainer;
    viewContainerRef.clear();

    if (this.rendererParams) {
      const componentRef = viewContainerRef.createComponent<IRendererComponent>(this.rendererParams.rendererComponent ? this.rendererParams.rendererComponent : this.defaultRenderer);
      componentRef.instance.stInit(this.rendererParams);
    }
  }
}

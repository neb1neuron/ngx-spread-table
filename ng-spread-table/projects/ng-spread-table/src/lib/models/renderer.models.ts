import { Type } from "@angular/core";

interface IRendererComponent {
  stInit(params: IRendererParams): void;
}

interface IRenderer {
  rendererParams: IRendererParams | undefined;
}

interface IRendererParams {
  rendererComponent: Type<any>;
  value?: any;
  [otherProperty: string | number | symbol]: any;
}

export { IRendererComponent, IRenderer, IRendererParams };

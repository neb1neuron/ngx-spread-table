import { EventEmitter, Type } from "@angular/core";

interface IEditorComponent {
  stInit(params: IEditorParams): void;
  setValue: EventEmitter<any>;
}

interface IEditor {
  editorParams: IEditorParams | undefined;
  setValue: EventEmitter<any>;
}

interface IEditorParams {
  editorComponent: Type<any>;
  data?: any;
  input?: any
  value?: any;
  column?: any;
  [otherProperty: string | number | symbol]: any;
}

export { IEditorComponent, IEditor, IEditorParams };
